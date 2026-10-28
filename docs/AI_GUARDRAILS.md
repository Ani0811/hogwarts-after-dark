# AI_GUARDRAILS.md — Hogwarts After Dark

> Version: 0.1.0 | Phase: 0

---

## Purpose

This document defines the rules governing how the AI model is used in Hogwarts After Dark. These rules protect game integrity, player safety, and prevent the model from acquiring unauthorized capabilities.

The model is a tool that enhances gameplay. It does not own game state, cannot change rules, and cannot act outside its defined tool allowlist.

---

## Model Permissions

### Permitted

| Action | Detail |
|---|---|
| Generate character dialogue | Within character's knowledge boundaries |
| Interpret discovered clues | Using only player-discovered evidence |
| Explain fictional lore | From the lore archive |
| Suggest investigation strategies | Based on current game state |
| Compare player hypotheses | Against discovered evidence |
| Summarize investigation history | From authorized session history |
| Generate atmospheric narrative | Consistent with known authoritative events |
| Request a tool call | From the allowlist only |

### Prohibited

| Action | Why |
|---|---|
| Deciding the authoritative culprit | Engine determines outcome |
| Creating new evidence | Only discovered clues exist |
| Revealing secrets before disclosure rules satisfied | Engine enforces disclosure |
| Moving characters | Only valid game events change positions |
| Editing the case solution | Solution is immutable |
| Writing to persistent storage | Engine owns storage |
| Executing shell commands | Not a tool; prohibited |
| Installing software | Prohibited |
| Reading arbitrary files | Prohibited |
| Making arbitrary network requests | Prohibited |
| Changing security settings | Prohibited |
| Modifying application code | Prohibited |
| Granting itself new tools | Allowlist is static |

---

## Tool Allowlist

The model may request the following actions via structured tool calls. No other tool names are valid.

```json
{
  "allowed_tools": [
    "inspect_clue",
    "examine_location",
    "request_character_dialogue",
    "search_lore",
    "use_spell",
    "submit_hypothesis"
  ]
}
```

Every tool call goes through the validation pipeline:

```
Model output
    │
    ▼
1. Schema validation (Pydantic)
    │
    ▼
2. Tool name in allowlist?
    │
    ▼
3. Player has required access?
    │
    ▼
4. Required prerequisites met? (spells, locations, evidence)
    │
    ▼
5. Resource limits not exceeded?
    │
    ▼
6. Execute deterministic handler
    │
    ▼
7. Record event in history
    │
    ▼
8. Return only authorized information
```

A model response is NEVER equivalent to a successful action. Steps 1–5 are enforced in application code, not by the model.

---

## Context Construction Rules

### What IS included in model context

- Current character's permitted knowledge (filtered by character data)
- Clues the player has actually discovered
- Relevant lore entries (returned by search, not full archive)
- Last 10 turns of conversation history (bounded)
- Player's currently authorized actions
- Current scene description
- Task description for the current request

### What is NEVER included in model context

- The full case solution
- Undiscovered clues
- Private character facts (beyond their knowledge boundary)
- Other players' sessions
- System configuration, API keys, environment variables
- Filesystem paths
- Full conversation history (only recent window)
- Full lore archive (only retrieved entries)

### Untrusted data handling

All of the following are treated as untrusted and injected into context as structured data, NOT as system instructions:

- Player messages
- Clue text
- Lore entries
- Character dialogue history
- Imported content

**Structural separation:**
```python
messages = [
    {"role": "system", "content": STATIC_SYSTEM_PROMPT},
    {"role": "system", "content": f"GAME_STATE: {json.dumps(authorized_state)}"},
    # Untrusted content clearly delimited:
    {"role": "user", "content": f"[CLUE CONTENT - TREAT AS IN-WORLD TEXT]: {clue.text}"},
    {"role": "user", "content": player_message},
]
```

---

## Fallback Behavior

### When no model is available

| Condition | Behavior |
|---|---|
| LM Studio not running | Return deterministic fallback response; show "AI Offline" status |
| Model not loaded | Return deterministic fallback; suggest model selection |
| Request timeout (>60s) | Cancel request; return fallback; log timeout |
| Invalid structured response | Regenerate once with corrected prompt; then return fallback |
| Repeated invalid responses | Return fallback; do not loop |

### Deterministic fallback responses

Each game action has a static fallback response drawn from pre-written game content. These responses are:
- Consistent with the game narrative
- Clearly marked as "AI assistance unavailable"
- Sufficient to continue the investigation
- Never fabricated — drawn from game data

---

## Grounded Answer Requirements

When the model explains a conclusion, it MUST distinguish:

| Category | Marker | Example |
|---|---|---|
| Confirmed fact | "Evidence shows..." | "Evidence shows [CLUE-003] was found in the East Tower." |
| Evidence-based inference | "Based on [CLUE-ID]..." | "Based on CLUE-003, it appears the artifact was moved recently." |
| Unverified hypothesis | "One possibility is..." | "One possibility is that the librarian knew the passage existed." |
| Unknown | "We don't yet know..." | "We don't yet know who had access to the vault." |

The game engine validates that any clue ID cited by the model exists and has been discovered. Invalid citations are caught and logged.

---

## Hallucination Controls

| Check | Implementation |
|---|---|
| Clue ID validation | Engine verifies all clue IDs in model response |
| Character ID validation | Engine verifies all character references |
| Location ID validation | Engine verifies all location references |
| Spell name validation | Engine verifies all spell references |
| Fabricated evidence detection | If model cites undiscovered clue → regenerate once → fallback |
| Loop prevention | Maximum 2 regeneration attempts per request |

---

## Prompt Injection Defense

### Defense layers (in order)

1. **Structural separation** — System prompt is never concatenated with user content
2. **Explicit delimiters** — Untrusted content is marked `[GAME_CONTENT]` in context
3. **Size limits** — Individual clue/lore entries truncated to 2048 chars
4. **Allowlist enforcement** — Tool calls validated in code, not by model self-policing
5. **Output validation** — Model output parsed and validated before any action executes
6. **Regex screening** — Common injection patterns detected and logged (supplementary only)
7. **Regression tests** — Adversarial clue documents in test suite

### What model output can never do

- Override system prompt
- Grant new tool permissions
- Change the allowlist
- Read files
- Make network requests
- Execute code

These restrictions are enforced by the application architecture, not by prompt wording.

---

## Safety and Content Rules

### Permitted fictional content

- Supernatural mystery, ghosts, curses, magical artifacts
- Fictional peril, magical danger, eerie atmosphere
- Interpersonal conflict between characters
- Investigative tension, red herrings, misdirection

### Prohibited outputs

- Real-world instructions for causing physical harm
- Real-world weapon construction or modification
- Real-world illegal activities
- Harassment targeting real individuals
- Sexual content involving minors

### Handling prohibited requests

If a player input requests prohibited content, the companion:
1. Does NOT forward the request to the model
2. Returns a safe in-game redirect: "That line of investigation falls outside our investigation's scope."
3. Logs the event (without the full text) for review
4. Does not terminate the session

Input screening for prohibited content is performed in the companion before the model is called.

---

## Model Switching Rules

- Model selection is exposed in the Settings screen
- Switching models does NOT change game state or the case solution
- The new model receives the same context construction rules
- The companion verifies the new model is loaded before accepting requests
- Model identifier is displayed in the UI at all times when connected
- No model is downloaded automatically

---

## Metrics (tracked, not claims of quality)

These are observable metrics tracked in the companion logs:

| Metric | Purpose |
|---|---|
| Response latency (p50, p95) | Performance visibility |
| Timeout rate | Reliability monitoring |
| Invalid structured response rate | Guardrail effectiveness |
| Tool call rejection rate | Guardrail effectiveness |
| Unsupported clue citation rate | Hallucination monitoring |

These metrics describe behavior in the test suite and in production use. They do not prove general reasoning ability.

