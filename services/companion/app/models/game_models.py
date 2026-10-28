"""
Hogwarts After Dark — Game Data Models (Pydantic)
These are the authoritative schemas for all game content.
"""

from __future__ import annotations

from enum import Enum
from typing import Any
from pydantic import BaseModel, Field, field_validator
import re


# ---------- Enums ----------

class ClueState(str, Enum):
    HIDDEN = "hidden"
    DISCOVERED = "discovered"
    EXAMINED = "examined"


class CharacterDisposition(str, Enum):
    COOPERATIVE = "cooperative"
    NEUTRAL = "neutral"
    EVASIVE = "evasive"
    HOSTILE = "hostile"


class SpellCategory(str, Enum):
    REVELATION = "revelation"
    EXAMINATION = "examination"
    ILLUMINATION = "illumination"
    DETECTION = "detection"
    PROTECTION = "protection"


class LocationState(str, Enum):
    ACCESSIBLE = "accessible"
    RESTRICTED = "restricted"
    LOCKED = "locked"


class EventType(str, Enum):
    LOCATION_VISITED = "location_visited"
    CLUE_DISCOVERED = "clue_discovered"
    CLUE_EXAMINED = "clue_examined"
    CHARACTER_INTERVIEWED = "character_interviewed"
    SPELL_CAST = "spell_cast"
    HYPOTHESIS_SUBMITTED = "hypothesis_submitted"
    VERDICT_SUBMITTED = "verdict_submitted"
    ARCHIVE_SEARCHED = "archive_searched"


# ---------- ID validator ----------

_ID_PATTERN = re.compile(r'^[a-z][a-z0-9_]{1,63}$')


def _validate_id(value: str) -> str:
    if not _ID_PATTERN.match(value):
        raise ValueError(
            f"ID '{value}' must be lowercase alphanumeric + underscores, "
            "2–64 chars, starting with a letter."
        )
    return value


# ---------- Core data models ----------

class Clue(BaseModel):
    """A discoverable piece of evidence."""
    id: str
    title: str = Field(max_length=200)
    description: str = Field(max_length=2000)
    location_id: str
    requires_spell: str | None = None  # spell ID needed to reveal
    # Tags for lore search indexing
    tags: list[str] = Field(default_factory=list)
    # Whether this clue can mislead (for documentation)
    is_misleading: bool = False

    @field_validator("id", "location_id")
    @classmethod
    def validate_id(cls, v: str) -> str:
        return _validate_id(v)


class CharacterKnowledge(BaseModel):
    """What a character knows — constrained by the case design."""
    public_facts: list[str] = Field(default_factory=list)
    # private_facts never leave the server; they define when info is revealed
    private_facts: list[str] = Field(default_factory=list)
    # Clue IDs this character can reference (if player has discovered them)
    known_clue_ids: list[str] = Field(default_factory=list)
    # Conditions under which private info is revealed
    reveals_under: list[str] = Field(default_factory=list, description="Condition IDs")


class Character(BaseModel):
    """A suspect or witness in the investigation."""
    id: str
    name: str = Field(max_length=100)
    role: str = Field(max_length=200)
    personality: str = Field(max_length=500)
    dialogue_style: str = Field(max_length=200)
    # What's publicly observable about them
    appearance: str = Field(max_length=500)
    knowledge: CharacterKnowledge
    relationships: dict[str, str] = Field(
        default_factory=dict,
        description="char_id -> relationship description"
    )
    location_id: str  # Current location
    is_suspect: bool = False
    portrait_description: str = Field(default="", max_length=500)

    @field_validator("id", "location_id")
    @classmethod
    def validate_id(cls, v: str) -> str:
        return _validate_id(v)


class Location(BaseModel):
    """An explorable location in the school."""
    id: str
    name: str = Field(max_length=200)
    description: str = Field(max_length=2000)
    atmosphere: str = Field(max_length=500)
    state: LocationState = LocationState.ACCESSIBLE
    connected_locations: list[str] = Field(default_factory=list)
    # IDs of clues that can be discovered here (may be hidden)
    available_clue_ids: list[str] = Field(default_factory=list)
    # IDs of characters currently here
    character_ids: list[str] = Field(default_factory=list)
    # Access restriction description (shown to player)
    access_restriction: str | None = None
    # Spell required to access (if RESTRICTED)
    requires_spell: str | None = None

    @field_validator("id")
    @classmethod
    def validate_id(cls, v: str) -> str:
        return _validate_id(v)


class Spell(BaseModel):
    """An investigative spell with deterministic game effects."""
    id: str
    name: str = Field(max_length=100)
    incantation: str = Field(max_length=100)
    description: str = Field(max_length=500)
    category: SpellCategory
    effect: str = Field(max_length=500)
    # What type of target this spell applies to
    target_type: str  # "clue", "location", "character", "self"
    # Whether this spell reveals hidden clues
    reveals_clues: bool = False
    # MP cost (if using a resource system)
    cost: int = Field(default=1, ge=0, le=10)

    @field_validator("id")
    @classmethod
    def validate_id(cls, v: str) -> str:
        return _validate_id(v)


class LoreEntry(BaseModel):
    """A searchable entry in the Restricted Section archive."""
    id: str
    title: str = Field(max_length=200)
    content: str = Field(max_length=4000)
    category: str = Field(max_length=100)
    tags: list[str] = Field(default_factory=list)
    # Whether this entry is relevant to the active case
    case_relevant: bool = False

    @field_validator("id")
    @classmethod
    def validate_id(cls, v: str) -> str:
        return _validate_id(v)


# ---------- Case models ----------

class CaseSolution(BaseModel):
    """
    The authoritative solution. NEVER sent to the frontend.
    Kept in server memory only.
    """
    culprit_id: str
    required_evidence_ids: list[str]  # Clue IDs player must have found
    explanation: str = Field(max_length=3000)
    # Alternative valid verdicts (partial credit)
    acceptable_culprit_ids: list[str] = Field(default_factory=list)

    @field_validator("culprit_id")
    @classmethod
    def validate_id(cls, v: str) -> str:
        return _validate_id(v)


class Case(BaseModel):
    """
    A complete mystery definition. The solution field is excluded
    from any public-facing serialization.
    """
    id: str
    title: str = Field(max_length=200)
    description: str = Field(max_length=2000)
    introduction: str = Field(max_length=3000)
    suspect_ids: list[str]
    location_ids: list[str]
    clue_ids: list[str]
    spell_ids: list[str]
    solution: CaseSolution

    @field_validator("id")
    @classmethod
    def validate_id(cls, v: str) -> str:
        return _validate_id(v)

    def public_dict(self) -> dict[str, Any]:
        """Return the case data safe to send to the frontend — no solution."""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "introduction": self.introduction,
            "suspect_ids": self.suspect_ids,
            "location_ids": self.location_ids,
            "clue_ids": self.clue_ids,
            "spell_ids": self.spell_ids,
            # solution is intentionally omitted
        }


# ---------- Session / game state models ----------

class InvestigationEvent(BaseModel):
    """An event recorded in the investigation history."""
    event_type: EventType
    timestamp: str  # ISO 8601
    details: dict[str, Any] = Field(default_factory=dict)


class SessionState(BaseModel):
    """The mutable game state for one investigation session."""
    session_id: str
    case_id: str
    created_at: str
    updated_at: str
    current_location_id: str
    discovered_clue_ids: set[str] = Field(default_factory=set)
    examined_clue_ids: set[str] = Field(default_factory=set)
    interviewed_character_ids: set[str] = Field(default_factory=set)
    cast_spells: list[str] = Field(default_factory=list)  # spell_id log
    submitted_hypotheses: list[dict[str, Any]] = Field(default_factory=list)
    history: list[InvestigationEvent] = Field(default_factory=list)
    verdict_submitted: bool = False
    verdict_correct: bool | None = None
    # Spell mana points
    mana_points: int = Field(default=20, ge=0, le=100)


# ---------- API request/response models ----------

class ActionRequest(BaseModel):
    """Generic action request from the frontend."""
    session_id: str = Field(max_length=64)
    action: str = Field(max_length=64)
    target_id: str | None = Field(default=None, max_length=64)
    parameters: dict[str, Any] = Field(default_factory=dict)

    @field_validator("action")
    @classmethod
    def action_in_allowlist(cls, v: str) -> str:
        allowed = {
            "move", "inspect_clue", "examine_location",
            "interview_character", "cast_spell",
            "search_archive", "submit_hypothesis", "submit_verdict",
        }
        if v not in allowed:
            raise ValueError(f"Unknown action '{v}'. Permitted: {sorted(allowed)}")
        return v

    @field_validator("target_id")
    @classmethod
    def target_id_safe(cls, v: str | None) -> str | None:
        """
        Prevent path traversal sequences and filesystem-unsafe characters in target IDs.
        target_id must match the same ID pattern as game entity IDs, or be None.
        """
        if v is None:
            return v
        # Reject path traversal sequences
        _UNSAFE = {"..","./","../","\\","/",":","*","?",'"',"<",">","|","%","~","$"}
        for seq in _UNSAFE:
            if seq in v:
                raise ValueError(
                    f"target_id contains unsafe sequence '{seq}'. "
                    "Only lowercase alphanumeric IDs with underscores are accepted."
                )
        # Must match game entity ID pattern
        if not _ID_PATTERN.match(v):
            raise ValueError(
                f"target_id '{v}' is not a valid game entity ID. "
                "Expected: lowercase alphanumeric + underscores, 2–64 chars."
            )
        return v


class ActionResponse(BaseModel):
    """Response returned to the frontend after an action."""
    success: bool
    action: str
    message: str = Field(max_length=2000)
    # Safe state update for the frontend
    state_update: dict[str, Any] = Field(default_factory=dict)
    # AI-generated narrative (optional, validated)
    narrative: str | None = Field(default=None, max_length=3000)
    # Whether the AI is available
    ai_available: bool = False


class HealthResponse(BaseModel):
    status: str  # "ok" | "degraded"
    companion_version: str
    ai_available: bool
    ai_model: str | None
    game_data_loaded: bool


class AIStatusResponse(BaseModel):
    available: bool
    model_id: str | None
    provider: str
    message: str
