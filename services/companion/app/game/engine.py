"""
Hogwarts After Dark — Game Engine
Deterministic game state management. Never calls AI.
This is the single source of truth for all game state.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from pydantic import ValidationError

from app.core.config import get_settings
from app.core.logging import get_logger
from app.models.game_models import (
    ActionRequest,
    ActionResponse,
    Case,
    Character,
    Clue,
    ClueState,
    EventType,
    InvestigationEvent,
    Location,
    LocationState,
    LoreEntry,
    SessionState,
    Spell,
    SpellCategory,
)

logger = get_logger(__name__)

# Tool allowlist — this is the ONLY source of truth for allowed actions.
# The AI model cannot add to this list.
ALLOWED_ACTIONS: frozenset[str] = frozenset({
    "move",
    "inspect_clue",
    "examine_location",
    "interview_character",
    "cast_spell",
    "search_archive",
    "submit_hypothesis",
    "submit_verdict",
})


class GameDataError(Exception):
    """Raised when game data files are missing or invalid."""


class InvalidActionError(Exception):
    """Raised when an action is not permitted in the current state."""


class GameData:
    """Loaded and validated game content. Immutable after initialization."""

    def __init__(self, data_path: Path) -> None:
        self._path = data_path
        self.cases: dict[str, Case] = {}
        self.characters: dict[str, Character] = {}
        self.locations: dict[str, Location] = {}
        self.clues: dict[str, Clue] = {}
        self.spells: dict[str, Spell] = {}
        self.lore: dict[str, LoreEntry] = {}

    def load(self) -> None:
        """Load all game data from JSON files. Raises GameDataError on failure."""
        self._load_directory(self._path / "cases", Case, self.cases)
        self._load_directory(self._path / "characters", Character, self.characters)
        self._load_directory(self._path / "locations", Location, self.locations)
        self._load_directory(self._path / "clues", Clue, self.clues)
        self._load_directory(self._path / "spells", Spell, self.spells)
        self._load_directory(self._path / "lore", LoreEntry, self.lore)
        # Build clue index from location data
        self._index_clues()
        logger.info(
            "game_data_loaded",
            cases=len(self.cases),
            characters=len(self.characters),
            locations=len(self.locations),
            spells=len(self.spells),
            lore=len(self.lore),
            clues=len(self.clues),
        )

    def _load_directory(self, path: Path, model_cls: Any, store: dict) -> None:  # noqa: ANN401
        if not path.exists():
            logger.warning("game_data_dir_missing", path=str(path))
            return
        for json_file in path.glob("*.json"):
            try:
                raw = json.loads(json_file.read_text(encoding="utf-8"))
                # Handle both single objects and arrays
                items = raw if isinstance(raw, list) else [raw]
                for item in items:
                    obj = model_cls(**item)
                    store[obj.id] = obj
            except (json.JSONDecodeError, ValidationError, KeyError) as exc:
                raise GameDataError(f"Failed to load {json_file}: {exc}") from exc

    def _index_clues(self) -> None:
        """Index clues from location data."""
        for loc in self.locations.values():
            for clue_id in loc.available_clue_ids:
                # Clues may also be in their own files; skip if already loaded
                if clue_id not in self.clues:
                    logger.debug("clue_referenced_but_not_in_clue_dir", clue_id=clue_id)

    @property
    def is_loaded(self) -> bool:
        return bool(self.cases or self.locations or self.characters)


class GameEngine:
    """
    The authoritative game engine. Deterministic. Never calls AI.
    Enforces all game rules independently of the AI model.
    """

    def __init__(self, game_data: GameData) -> None:
        self._data = game_data
        self._sessions: dict[str, SessionState] = {}

    # ---------- Session management ----------

    def create_session(self, case_id: str) -> SessionState:
        if case_id not in self._data.cases:
            raise InvalidActionError(f"Unknown case: '{case_id}'")
        case = self._data.cases[case_id]
        if not case.location_ids:
            raise InvalidActionError(f"Case '{case_id}' has no locations defined.")
        now = _now_iso()
        session = SessionState(
            session_id=str(uuid.uuid4()),
            case_id=case_id,
            created_at=now,
            updated_at=now,
            current_location_id=case.location_ids[0],
        )
        self._sessions[session.session_id] = session
        self._record_event(session, EventType.LOCATION_VISITED, {
            "location_id": session.current_location_id
        })
        logger.info("session_created", session_id=session.session_id, case_id=case_id)
        return session

    def get_session(self, session_id: str) -> SessionState:
        session = self._sessions.get(session_id)
        if not session:
            raise InvalidActionError(f"Session '{session_id}' not found.")
        return session

    def load_session(self, state_dict: dict[str, Any]) -> SessionState:
        """Restore a session from a saved state dict."""
        session = SessionState(**state_dict)
        self._sessions[session.session_id] = session
        return session

    def export_session(self, session_id: str) -> dict[str, Any]:
        """
        Export session state for saving.
        NOTE: The case solution is NOT included in this export.
        """
        session = self.get_session(session_id)
        data = session.model_dump()
        # Ensure sets are serialized as lists
        data["discovered_clue_ids"] = list(session.discovered_clue_ids)
        data["examined_clue_ids"] = list(session.examined_clue_ids)
        data["interviewed_character_ids"] = list(session.interviewed_character_ids)
        return data

    # ---------- Action processing ----------

    def process_action(self, request: ActionRequest) -> ActionResponse:
        """
        Process a player action. This is the main entry point for all game actions.
        ALWAYS validates the action independently before executing it.
        The AI model's suggestions go through this method — never bypass it.
        """
        # Validate action name against allowlist
        if request.action not in ALLOWED_ACTIONS:
            logger.warning(
                "action_not_in_allowlist",
                action=request.action,
                session_id=request.session_id,
            )
            return ActionResponse(
                success=False,
                action=request.action,
                message=f"Unknown action '{request.action}'.",
            )

        try:
            session = self.get_session(request.session_id)
        except InvalidActionError as exc:
            return ActionResponse(success=False, action=request.action, message=str(exc))

        if session.verdict_submitted:
            return ActionResponse(
                success=False,
                action=request.action,
                message="The investigation is concluded. You have already submitted a verdict.",
            )

        try:
            return self._dispatch_action(session, request)
        except InvalidActionError as exc:
            return ActionResponse(success=False, action=request.action, message=str(exc))

    def _dispatch_action(self, session: SessionState, request: ActionRequest) -> ActionResponse:
        handlers = {
            "move": self._action_move,
            "inspect_clue": self._action_inspect_clue,
            "examine_location": self._action_examine_location,
            "interview_character": self._action_interview_character,
            "cast_spell": self._action_cast_spell,
            "search_archive": self._action_search_archive,
            "submit_hypothesis": self._action_submit_hypothesis,
            "submit_verdict": self._action_submit_verdict,
        }
        handler = handlers[request.action]
        return handler(session, request)

    def _action_move(self, session: SessionState, request: ActionRequest) -> ActionResponse:
        target_id = _require_target(request)
        current_loc = self._require_location(session.current_location_id)

        if target_id not in current_loc.connected_locations:
            raise InvalidActionError(
                f"Location '{target_id}' is not reachable from '{session.current_location_id}'."
            )

        target_loc = self._require_location(target_id)

        if target_loc.state == LocationState.LOCKED:
            raise InvalidActionError(
                f"'{target_loc.name}' is locked. {target_loc.access_restriction or ''}"
            )
        if target_loc.state == LocationState.RESTRICTED:
            if target_loc.requires_spell and target_loc.requires_spell not in session.cast_spells:
                raise InvalidActionError(
                    f"'{target_loc.name}' requires {target_loc.requires_spell} to access. "
                    f"{target_loc.access_restriction or ''}"
                )

        session.current_location_id = target_id
        session.updated_at = _now_iso()
        self._record_event(session, EventType.LOCATION_VISITED, {"location_id": target_id})

        return ActionResponse(
            success=True,
            action="move",
            message=f"You move to {target_loc.name}.",
            state_update={
                "current_location_id": target_id,
                "location": self._public_location(target_loc, session),
            },
        )

    def _action_inspect_clue(self, session: SessionState, request: ActionRequest) -> ActionResponse:
        clue_id = _require_target(request)
        clue = self._require_clue(clue_id)

        # Clue must be in current location
        current_loc = self._require_location(session.current_location_id)
        if clue_id not in current_loc.available_clue_ids:
            raise InvalidActionError(
                f"Clue '{clue_id}' is not available at your current location."
            )

        # Check spell requirement
        if clue.requires_spell and clue.requires_spell not in session.cast_spells:
            raise InvalidActionError(
                f"This clue requires casting '{clue.requires_spell}' to reveal."
            )

        # Discover or re-examine
        is_new = clue_id not in session.discovered_clue_ids
        session.discovered_clue_ids.add(clue_id)
        session.updated_at = _now_iso()

        event_type = EventType.CLUE_DISCOVERED if is_new else EventType.CLUE_EXAMINED
        self._record_event(session, event_type, {"clue_id": clue_id})

        return ActionResponse(
            success=True,
            action="inspect_clue",
            message=f"You examine {clue.title}." if not is_new else f"You discover {clue.title}.",
            state_update={
                "discovered_clue_id": clue_id,
                "clue": {
                    "id": clue.id,
                    "title": clue.title,
                    "description": clue.description,
                },
            },
        )

    def _action_examine_location(self, session: SessionState, request: ActionRequest) -> ActionResponse:
        location = self._require_location(session.current_location_id)
        # Return public location info (without hidden clues)
        return ActionResponse(
            success=True,
            action="examine_location",
            message=f"You survey {location.name} carefully.",
            state_update={
                "location": self._public_location(location, session),
            },
        )

    def _action_interview_character(
        self, session: SessionState, request: ActionRequest
    ) -> ActionResponse:
        char_id = _require_target(request)
        character = self._require_character(char_id)

        # Character must be at current location
        current_loc = self._require_location(session.current_location_id)
        if char_id not in current_loc.character_ids:
            raise InvalidActionError(
                f"{character.name} is not at your current location."
            )

        session.interviewed_character_ids.add(char_id)
        session.updated_at = _now_iso()
        self._record_event(session, EventType.CHARACTER_INTERVIEWED, {"character_id": char_id})

        # Return public character info + the knowledge they're permitted to share
        permitted_knowledge = self._build_character_context(character, session)

        return ActionResponse(
            success=True,
            action="interview_character",
            message=f"You approach {character.name}.",
            state_update={
                "character": {
                    "id": character.id,
                    "name": character.name,
                    "role": character.role,
                    "appearance": character.appearance,
                    "dialogue_style": character.dialogue_style,
                },
                "permitted_knowledge": permitted_knowledge,
                "interviewed": True,
            },
        )

    def _action_cast_spell(self, session: SessionState, request: ActionRequest) -> ActionResponse:
        spell_id = _require_target(request)
        spell = self._require_spell(spell_id)

        # Check mana
        if session.mana_points < spell.cost:
            raise InvalidActionError(
                f"Insufficient mana. Casting {spell.name} costs {spell.cost} MP "
                f"(you have {session.mana_points})."
            )

        session.mana_points -= spell.cost
        session.cast_spells.append(spell_id)
        session.updated_at = _now_iso()
        self._record_event(session, EventType.SPELL_CAST, {
            "spell_id": spell_id,
            "mana_remaining": session.mana_points,
        })

        # If spell reveals clues in current location
        revealed_clues: list[dict[str, Any]] = []
        if spell.reveals_clues:
            current_loc = self._require_location(session.current_location_id)
            for clue_id in current_loc.available_clue_ids:
                clue = self._data.clues.get(clue_id)
                if clue and clue.requires_spell == spell_id:
                    session.discovered_clue_ids.add(clue_id)
                    self._record_event(session, EventType.CLUE_DISCOVERED, {"clue_id": clue_id})
                    revealed_clues.append({"id": clue.id, "title": clue.title})

        return ActionResponse(
            success=True,
            action="cast_spell",
            message=f'"{spell.incantation}!" — {spell.effect}',
            state_update={
                "spell_id": spell_id,
                "spell_name": spell.name,
                "mana_remaining": session.mana_points,
                "revealed_clues": revealed_clues,
            },
        )

    def _action_search_archive(
        self, session: SessionState, request: ActionRequest
    ) -> ActionResponse:
        query = str(request.parameters.get("query", ""))[:200].strip()
        if not query:
            raise InvalidActionError("Please provide a search query.")

        query_lower = query.lower()
        results: list[dict[str, Any]] = []
        for entry in self._data.lore.values():
            if (
                query_lower in entry.title.lower()
                or query_lower in entry.content.lower()
                or any(query_lower in tag.lower() for tag in entry.tags)
            ):
                results.append({
                    "id": entry.id,
                    "title": entry.title,
                    "category": entry.category,
                    "excerpt": entry.content[:300],
                })
            if len(results) >= 5:  # Cap results
                break

        self._record_event(session, EventType.ARCHIVE_SEARCHED, {"query": query[:50]})

        return ActionResponse(
            success=True,
            action="search_archive",
            message=f'Found {len(results)} entry/entries for "{query}".',
            state_update={"results": results},
        )

    def _action_submit_hypothesis(
        self, session: SessionState, request: ActionRequest
    ) -> ActionResponse:
        hypothesis = str(request.parameters.get("hypothesis", ""))[:1000].strip()
        if not hypothesis:
            raise InvalidActionError("Please provide a hypothesis.")

        session.submitted_hypotheses.append({
            "hypothesis": hypothesis,
            "timestamp": _now_iso(),
            "evidence_referenced": request.parameters.get("evidence_ids", [])[:10],
        })
        session.updated_at = _now_iso()
        self._record_event(session, EventType.HYPOTHESIS_SUBMITTED, {"hypothesis": hypothesis[:100]})

        return ActionResponse(
            success=True,
            action="submit_hypothesis",
            message="Hypothesis recorded in your investigation journal.",
            state_update={"hypothesis_count": len(session.submitted_hypotheses)},
        )

    def _action_submit_verdict(
        self, session: SessionState, request: ActionRequest
    ) -> ActionResponse:
        """
        Evaluate the player's final verdict against the authoritative solution.
        NEVER exposes the solution text in the response.
        """
        if session.verdict_submitted:
            return ActionResponse(
                success=False,
                action="submit_verdict",
                message="You have already submitted a verdict for this investigation.",
            )

        culprit_id = str(request.parameters.get("culprit_id", ""))
        evidence_ids = list(request.parameters.get("evidence_ids", []))[:20]

        if not culprit_id:
            raise InvalidActionError("You must name a suspect.")

        case = self._data.cases.get(session.case_id)
        if not case:
            raise InvalidActionError("Case data not found.")

        solution = case.solution

        # Check if player has the required evidence
        missing_evidence = [
            eid for eid in solution.required_evidence_ids
            if eid not in session.discovered_clue_ids
        ]

        # Evaluate the verdict
        culprit_correct = (
            culprit_id == solution.culprit_id
            or culprit_id in solution.acceptable_culprit_ids
        )

        # Partial success: correct culprit, missing some evidence
        if culprit_correct and missing_evidence:
            verdict_text = (
                "You have identified the correct culprit, but your evidence file is incomplete. "
                f"You are still missing {len(missing_evidence)} key piece(s) of evidence. "
                "The case is solved, but the investigation record is not fully documented."
            )
            correct = True
        elif culprit_correct:
            verdict_text = (
                "Remarkable. The evidence supports your conclusion, and your reasoning is sound. "
                "The investigation is complete."
            )
            correct = True
        else:
            verdict_text = (
                "The evidence does not support this conclusion. "
                "Review your findings and reconsider the possibilities. "
                "You may continue the investigation."
            )
            correct = False

        if correct:
            session.verdict_submitted = True
            session.verdict_correct = True
        # If wrong, the player can keep investigating

        session.updated_at = _now_iso()
        self._record_event(session, EventType.VERDICT_SUBMITTED, {
            "culprit_id": culprit_id,
            "correct": correct,
            "evidence_count": len(evidence_ids),
        })

        return ActionResponse(
            success=correct,
            action="submit_verdict",
            message=verdict_text,
            state_update={
                "verdict_correct": correct,
                "verdict_submitted": correct,
                "evidence_complete": not missing_evidence if correct else False,
            },
        )

    # ---------- Context building (for AI integration) ----------

    def build_character_ai_context(
        self, session: SessionState, character_id: str
    ) -> dict[str, Any]:
        """
        Build the MINIMUM context needed for the AI to portray a character.
        NEVER includes the case solution.
        NEVER includes undiscovered clues.
        NEVER includes private facts beyond disclosure conditions.
        """
        character = self._require_character(character_id)
        case = self._data.cases.get(session.case_id)

        # Only include clues the player has actually found AND the character knows about
        shared_clues: list[dict[str, str]] = []
        for clue_id in character.knowledge.known_clue_ids:
            if clue_id in session.discovered_clue_ids:
                clue = self._data.clues.get(clue_id)
                if clue:
                    shared_clues.append({"id": clue.id, "title": clue.title, "description": clue.description})

        return {
            "character_id": character.id,
            "character_name": character.name,
            "role": character.role,
            "personality": character.personality,
            "dialogue_style": character.dialogue_style,
            "public_facts": character.knowledge.public_facts,
            "shared_clues": shared_clues,  # Only discovered clues this character knows
            "case_title": case.title if case else "Unknown",
            # Intentionally omitted: private_facts, solution, full clue list
        }

    def validate_model_clue_references(
        self, session: SessionState, clue_ids: list[str]
    ) -> tuple[list[str], list[str]]:
        """
        Validate that all clue IDs referenced by the model actually exist
        and have been discovered by the player.
        Returns (valid_ids, invalid_ids).
        """
        valid, invalid = [], []
        for cid in clue_ids:
            if cid in self._data.clues and cid in session.discovered_clue_ids:
                valid.append(cid)
            else:
                invalid.append(cid)
        return valid, invalid

    # ---------- Public state (safe for frontend) ----------

    def get_public_state(self, session_id: str) -> dict[str, Any]:
        """Return the game state safe to send to the frontend."""
        session = self.get_session(session_id)
        case = self._data.cases.get(session.case_id)
        current_loc = self._data.locations.get(session.current_location_id)

        return {
            "session_id": session.session_id,
            "case_id": session.case_id,
            "case_title": case.title if case else "Unknown",
            "current_location_id": session.current_location_id,
            "current_location_name": current_loc.name if current_loc else "Unknown",
            "discovered_clue_count": len(session.discovered_clue_ids),
            "interviewed_character_count": len(session.interviewed_character_ids),
            "mana_points": session.mana_points,
            "verdict_submitted": session.verdict_submitted,
            "verdict_correct": session.verdict_correct,
            "hypothesis_count": len(session.submitted_hypotheses),
            # Discovered clues (safe — player has already found these)
            "discovered_clues": [
                {"id": c.id, "title": c.title, "description": c.description}
                for cid in session.discovered_clue_ids
                if (c := self._data.clues.get(cid))
            ],
            # Accessible suspects
            "suspects": [
                {"id": ch.id, "name": ch.name, "role": ch.role, "is_suspect": ch.is_suspect}
                for sid in (case.suspect_ids if case else [])
                if (ch := self._data.characters.get(sid))
            ],
        }

    # ---------- Private helpers ----------

    def _require_location(self, location_id: str) -> Location:
        loc = self._data.locations.get(location_id)
        if not loc:
            raise InvalidActionError(f"Location '{location_id}' does not exist.")
        return loc

    def _require_clue(self, clue_id: str) -> Clue:
        clue = self._data.clues.get(clue_id)
        if not clue:
            raise InvalidActionError(f"Clue '{clue_id}' does not exist.")
        return clue

    def _require_character(self, char_id: str) -> Character:
        char = self._data.characters.get(char_id)
        if not char:
            raise InvalidActionError(f"Character '{char_id}' does not exist.")
        return char

    def _require_spell(self, spell_id: str) -> Spell:
        spell = self._data.spells.get(spell_id)
        if not spell:
            raise InvalidActionError(f"Spell '{spell_id}' does not exist.")
        return spell

    def _public_location(self, location: Location, session: SessionState) -> dict[str, Any]:
        """Return location data safe for the frontend (no hidden clue details)."""
        return {
            "id": location.id,
            "name": location.name,
            "description": location.description,
            "atmosphere": location.atmosphere,
            "state": location.state.value,
            "connected_locations": location.connected_locations,
            "characters_here": [
                {"id": ch.id, "name": ch.name, "role": ch.role}
                for cid in location.character_ids
                if (ch := self._data.characters.get(cid))
            ],
            # Only show clues the player has already discovered
            "known_clues": [
                {"id": cl.id, "title": cl.title}
                for cid in location.available_clue_ids
                if cid in session.discovered_clue_ids
                and (cl := self._data.clues.get(cid))
            ],
            # Indicate if there are undiscovered clues without revealing details
            "has_hidden_clues": any(
                cid not in session.discovered_clue_ids
                for cid in location.available_clue_ids
            ),
        }

    def _build_character_context(
        self, character: Character, session: SessionState
    ) -> dict[str, Any]:
        """Build the character context for the AI — minimum needed, no solution."""
        return self.build_character_ai_context(session, character.id)

    def _record_event(
        self, session: SessionState, event_type: EventType, details: dict[str, Any]
    ) -> None:
        event = InvestigationEvent(
            event_type=event_type,
            timestamp=_now_iso(),
            details=details,
        )
        session.history.append(event)
        # Keep history bounded
        max_events = 200
        if len(session.history) > max_events:
            session.history = session.history[-max_events:]


def _now_iso() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


def _require_target(request: ActionRequest) -> str:
    if not request.target_id:
        raise InvalidActionError(f"Action '{request.action}' requires a target_id.")
    return request.target_id

