"""
Hogwarts After Dark — AI Provider Abstraction
Supports LM Studio (OpenAI-compatible) and deterministic fallback.
"""

from __future__ import annotations

import asyncio
import json
import re
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any

import httpx

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)


# ---------- Response types ----------

@dataclass
class AIMessage:
    role: str  # "system" | "user" | "assistant"
    content: str


@dataclass
class AIResponse:
    content: str
    model: str
    finish_reason: str  # "stop" | "length" | "timeout" | "fallback" | "error"
    tool_calls: list[dict[str, Any]] = field(default_factory=list)
    latency_ms: float = 0.0
    is_fallback: bool = False


# ---------- Base provider ----------

class AIProvider(ABC):
    @abstractmethod
    async def check_available(self) -> bool:
        """Return True if the runtime is reachable and has a model loaded."""

    @abstractmethod
    async def get_model_id(self) -> str | None:
        """Return the identifier of the currently loaded model, or None."""

    @abstractmethod
    async def chat(
        self,
        messages: list[AIMessage],
        *,
        max_tokens: int = 512,
        temperature: float = 0.7,
        timeout: float | None = None,
    ) -> AIResponse:
        """Send a chat request and return a validated AIResponse."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Human-readable provider name."""


# ---------- LM Studio provider ----------

class LMStudioProvider(AIProvider):
    """
    Connects to LM Studio's OpenAI-compatible local API.
    Binds only to 127.0.0.1 by default.
    """

    provider_name = "LM Studio"

    def __init__(self, base_url: str | None = None, timeout: float | None = None) -> None:
        settings = get_settings()
        self._base_url = (base_url or settings.ai_provider_base_url).rstrip("/")
        self._default_timeout = timeout or settings.ai_request_timeout_seconds
        self._client: httpx.AsyncClient | None = None

    def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self._base_url,
                timeout=httpx.Timeout(
                    connect=5.0,
                    read=self._default_timeout,
                    write=10.0,
                    pool=5.0,
                ),
                headers={"Content-Type": "application/json"},
            )
        return self._client

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def check_available(self) -> bool:
        try:
            client = self._get_client()
            resp = await client.get("/models", timeout=5.0)
            resp.raise_for_status()
            data = resp.json()
            models = data.get("data", [])
            if not models:
                logger.info("lm_studio_available_no_model_loaded")
                return False
            logger.info("lm_studio_available", model_count=len(models))
            return True
        except (httpx.ConnectError, httpx.TimeoutException):
            logger.info("lm_studio_unavailable_connection_failed")
            return False
        except Exception as exc:
            logger.warning("lm_studio_check_error", error=str(exc))
            return False

    async def get_model_id(self) -> str | None:
        try:
            client = self._get_client()
            resp = await client.get("/models", timeout=5.0)
            resp.raise_for_status()
            data = resp.json()
            models = data.get("data", [])
            if models:
                return models[0].get("id")
            return None
        except Exception:
            return None

    async def chat(
        self,
        messages: list[AIMessage],
        *,
        max_tokens: int = 512,
        temperature: float = 0.7,
        timeout: float | None = None,
    ) -> AIResponse:
        import time
        t0 = time.monotonic()
        effective_timeout = timeout or self._default_timeout

        payload: dict[str, Any] = {
            "model": await self.get_model_id() or "default",
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "max_tokens": max_tokens,
            "temperature": temperature,
            "stream": False,
        }

        try:
            client = self._get_client()
            resp = await asyncio.wait_for(
                client.post("/chat/completions", json=payload),
                timeout=effective_timeout,
            )
            resp.raise_for_status()
            data = resp.json()

            choice = data["choices"][0]
            content = choice["message"]["content"] or ""
            finish_reason = choice.get("finish_reason", "stop")
            model_id = data.get("model", "unknown")
            latency_ms = (time.monotonic() - t0) * 1000

            # Extract tool calls if present (structured output)
            tool_calls: list[dict[str, Any]] = []
            raw_tool_calls = choice["message"].get("tool_calls", [])
            if raw_tool_calls:
                tool_calls = _parse_tool_calls(raw_tool_calls)

            logger.info(
                "ai_chat_success",
                model=model_id,
                finish_reason=finish_reason,
                latency_ms=round(latency_ms, 1),
                output_chars=len(content),
            )

            return AIResponse(
                content=content,
                model=model_id,
                finish_reason=finish_reason,
                tool_calls=tool_calls,
                latency_ms=latency_ms,
            )

        except asyncio.TimeoutError:
            latency_ms = (time.monotonic() - t0) * 1000
            logger.warning("ai_chat_timeout", latency_ms=round(latency_ms, 1))
            return AIResponse(
                content="",
                model="unknown",
                finish_reason="timeout",
                latency_ms=latency_ms,
                is_fallback=True,
            )
        except httpx.HTTPStatusError as exc:
            logger.warning("ai_chat_http_error", status=exc.response.status_code)
            return AIResponse(
                content="",
                model="unknown",
                finish_reason="error",
                is_fallback=True,
            )
        except Exception as exc:
            logger.warning("ai_chat_error", error=type(exc).__name__)
            return AIResponse(
                content="",
                model="unknown",
                finish_reason="error",
                is_fallback=True,
            )


# ---------- Deterministic fallback provider ----------

class FallbackProvider(AIProvider):
    """
    Provides pre-written deterministic responses.
    No model required. All responses are from curated game content.
    """

    provider_name = "Demo (No AI)"

    # Pre-written fallback responses keyed by context type
    _FALLBACK_RESPONSES: dict[str, str] = {
        "character_dialogue_default": (
            "The character regards you with a measured expression. "
            "\"I've told you everything I know,\" they say carefully. "
            "\"Perhaps you should look elsewhere for answers.\""
        ),
        "clue_interpretation_default": (
            "This clue warrants careful consideration. "
            "It appears relevant to the events in question, though its full significance "
            "may only become clear once more evidence is gathered."
        ),
        "lore_search_default": (
            "The archive holds many secrets. "
            "This particular subject has been studied by scholars for generations, "
            "though complete understanding remains elusive."
        ),
        "hypothesis_default": (
            "Your hypothesis is noted. "
            "The evidence available so far provides some support, "
            "though you may wish to gather more before drawing a firm conclusion."
        ),
        "generic_default": (
            "[AI assistance is currently unavailable. "
            "The investigation continues using the deterministic engine. "
            "Connect LM Studio with a compatible model to enable enhanced character dialogue.]"
        ),
    }

    async def check_available(self) -> bool:
        return False  # Always indicates AI is not available

    async def get_model_id(self) -> str | None:
        return None

    async def chat(
        self,
        messages: list[AIMessage],
        *,
        max_tokens: int = 512,
        temperature: float = 0.7,
        timeout: float | None = None,
    ) -> AIResponse:
        # Determine which fallback to use based on system context
        context_key = "generic_default"
        for msg in messages:
            if msg.role == "system":
                if "dialogue" in msg.content.lower():
                    context_key = "character_dialogue_default"
                elif "clue" in msg.content.lower() or "evidence" in msg.content.lower():
                    context_key = "clue_interpretation_default"
                elif "lore" in msg.content.lower() or "archive" in msg.content.lower():
                    context_key = "lore_search_default"
                elif "hypothesis" in msg.content.lower():
                    context_key = "hypothesis_default"
                break

        return AIResponse(
            content=self._FALLBACK_RESPONSES.get(context_key, self._FALLBACK_RESPONSES["generic_default"]),
            model="fallback",
            finish_reason="fallback",
            is_fallback=True,
        )


# ---------- Provider factory ----------

def create_provider(force_fallback: bool = False) -> AIProvider:
    """
    Return the appropriate AI provider.
    If force_fallback is True, always return the deterministic provider.
    """
    settings = get_settings()
    if force_fallback or settings.demo_mode:
        logger.info("ai_provider_selected", provider="fallback")
        return FallbackProvider()
    logger.info("ai_provider_selected", provider="lm_studio", base_url=settings.ai_provider_base_url)
    return LMStudioProvider()


# ---------- Helpers ----------

def _parse_tool_calls(raw: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Parse and minimally validate tool calls from a model response."""
    result: list[dict[str, Any]] = []
    for tc in raw:
        try:
            fn = tc.get("function", {})
            name = fn.get("name", "")
            args_raw = fn.get("arguments", "{}")
            if isinstance(args_raw, str):
                args = json.loads(args_raw)
            else:
                args = args_raw
            result.append({"name": name, "arguments": args})
        except (json.JSONDecodeError, AttributeError, TypeError) as exc:
            logger.warning("tool_call_parse_error", error=str(exc))
            continue
    return result


def sanitize_model_text(text: str, max_chars: int = 3000) -> str:
    """
    Remove obvious injection attempts from model output before display.
    This is a supplementary layer — the engine never trusts model text as instructions.
    Primary XSS protection is the Content Security Policy, not this function.
    """
    # Remove script blocks including their content
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
    # Remove all remaining HTML tags (content preserved)
    text = re.sub(r'<[^>]{0,200}>', '', text)
    # Remove javascript: protocol
    text = re.sub(r'javascript\s*:', '', text, flags=re.IGNORECASE)
    # Remove event handler attributes
    text = re.sub(r'on\w+\s*=', '', text, flags=re.IGNORECASE)
    # Truncate
    return text[:max_chars]
