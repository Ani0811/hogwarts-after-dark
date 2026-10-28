"""
Hogwarts After Dark — Security Middleware
Origin validation, host header validation, request size limits.
DNS rebinding defense and CSRF protection for state-changing endpoints.
"""

from __future__ import annotations

import secrets
import time
from collections import defaultdict, deque
from typing import Awaitable, Callable

from fastapi import HTTPException, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class SecurityMiddleware(BaseHTTPMiddleware):
    """
    Enforces:
    1. Request body size limit
    2. Host header validation (DNS rebinding defense)
    3. Origin validation for state-changing requests
    4. Rate limiting per session/IP
    5. X-Content-Type-Options and other security headers on responses
    """

    def __init__(self, app, **kwargs) -> None:  # type: ignore[override]
        super().__init__(app, **kwargs)
        self._settings = get_settings()
        self._rate_store: dict[str, deque] = defaultdict(deque)
        self._window_seconds = 60
        self._max_requests = self._settings.rate_limit_per_minute

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        # 1. Request body size
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > self._settings.max_request_body_bytes:
                    logger.warning(
                        "request_too_large",
                        content_length=content_length,
                        path=request.url.path,
                    )
                    return Response(
                        content='{"detail":"Request body too large"}',
                        status_code=413,
                        media_type="application/json",
                    )
            except ValueError:
                pass

        # 2. Host header validation (DNS rebinding)
        host = request.headers.get("host", "")
        if not _is_valid_host(host):
            logger.warning("dns_rebinding_attempt", host=host, path=request.url.path)
            return Response(
                content='{"detail":"Invalid host header"}',
                status_code=421,
                media_type="application/json",
            )

        # 3. Origin validation for non-GET, non-health requests
        if request.method not in ("GET", "HEAD", "OPTIONS"):
            origin = request.headers.get("origin", "")
            if origin and not self._is_allowed_origin(origin):
                logger.warning(
                    "cors_origin_rejected",
                    origin=origin,
                    path=request.url.path,
                )
                return Response(
                    content='{"detail":"Origin not allowed"}',
                    status_code=403,
                    media_type="application/json",
                )

        # 4. Rate limiting (simple sliding window)
        client_key = _get_client_key(request)
        if not self._check_rate_limit(client_key):
            return Response(
                content='{"detail":"Too many requests"}',
                status_code=429,
                media_type="application/json",
            )

        # Process request
        response = await call_next(request)

        # 5. Security response headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Cache-Control"] = "no-store"

        return response

    def _is_allowed_origin(self, origin: str) -> bool:
        return origin in self._settings.companion_allowed_origins

    def _check_rate_limit(self, key: str) -> bool:
        now = time.monotonic()
        window = self._rate_store[key]
        # Remove old entries
        while window and window[0] < now - self._window_seconds:
            window.popleft()
        if len(window) >= self._max_requests:
            return False
        window.append(now)
        return True


def _is_valid_host(host: str) -> bool:
    """
    Validate the Host header against localhost patterns.
    Defends against DNS rebinding attacks.
    Supports IPv4, IPv6 (with or without brackets), and localhost names with optional ports.
    """
    if not host:
        return False

    raw = host.strip().lower()

    # Handle IPv6 in brackets, e.g. [::1] or [::1]:8765
    if raw.startswith("["):
        bracket_end = raw.find("]")
        if bracket_end != -1:
            ip_part = raw[1:bracket_end]
            return ip_part in {"::1", "0:0:0:0:0:0:0:1"}
        return False

    # Bare ::1
    if raw == "::1":
        return True

    # Strip port if present (only when single colon, standard for host:port)
    if raw.count(":") == 1:
        raw = raw.split(":", 1)[0]

    allowed_hosts = {"localhost", "127.0.0.1", "::1"}
    return raw in allowed_hosts


def _get_client_key(request: Request) -> str:
    """Derive a rate-limit key from the request."""
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        # Never trust x-forwarded-for for security decisions on localhost
        pass
    client = request.client
    ip = client.host if client else "unknown"
    return f"ip:{ip}"


# ---------- Pairing token management ----------

class PairingTokenStore:
    """
    Manages session pairing tokens.
    Tokens are generated at companion startup and expire after a configurable duration.
    They are NEVER embedded in the frontend bundle.
    """

    def __init__(self, token_lifetime_seconds: int = 86400) -> None:
        self._tokens: dict[str, float] = {}  # token -> expiry timestamp
        self._lifetime = token_lifetime_seconds

    def generate_token(self) -> str:
        """Generate a new pairing token. Display this in the terminal."""
        token = secrets.token_urlsafe(32)
        self._tokens[token] = time.monotonic() + self._lifetime
        return token

    def validate_token(self, token: str) -> bool:
        """Return True if the token is valid and not expired."""
        if not token:
            return False
        expiry = self._tokens.get(token)
        if expiry is None:
            return False
        if time.monotonic() > expiry:
            del self._tokens[token]
            logger.info("pairing_token_expired")
            return False
        return True

    def revoke_token(self, token: str) -> None:
        self._tokens.pop(token, None)


# ---------- Pairing token dependency ----------

_token_store = PairingTokenStore()


def get_token_store() -> PairingTokenStore:
    return _token_store


async def require_pairing_token(request: Request) -> None:
    """
    FastAPI dependency. Requires a valid pairing token on state-changing endpoints.
    Token is passed in the X-Pairing-Token header.
    """
    # Health and status endpoints are exempt
    exempt_paths = {"/health", "/ready", "/ai/status", "/docs", "/openapi.json"}
    if request.url.path in exempt_paths:
        return

    # OPTIONS (CORS preflight) is exempt
    if request.method == "OPTIONS":
        return

    # GET requests are exempt from token requirement
    if request.method == "GET":
        return

    token = request.headers.get("x-pairing-token", "")
    if not _token_store.validate_token(token):
        logger.warning(
            "invalid_pairing_token",
            path=request.url.path,
            method=request.method,
        )
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing pairing token. Connect through the official frontend.",
        )
