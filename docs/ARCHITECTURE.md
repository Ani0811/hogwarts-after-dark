# ARCHITECTURE.md — Hogwarts After Dark

> Version: 0.1.0 | Phase: 0

---

## System Overview

Hogwarts After Dark is a magical investigation game consisting of three independently deployable components:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TRUST BOUNDARY: PUBLIC INTERNET              │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  PUBLIC FRONTEND (Static HTML/JS/CSS)                        │  │
│  │  Hosted: GitHub Pages / Cloudflare Pages / Netlify (free)   │  │
│  │  Origin: https://[owner].github.io/hogwarts-after-dark       │  │
│  │  Content: React SPA, game UI, demo mode, setup instructions  │  │
│  │  NO server-side code. NO AI API keys. NO private data.       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                            │ HTTPS only                             │
│                            │ user must explicitly connect           │
└────────────────────────────┼────────────────────────────────────────┘
                             │
                    ┌────────▼──────────────────────────────────────────┐
                    │       TRUST BOUNDARY: PLAYER'S MACHINE            │
                    │                                                    │
                    │  ┌──────────────────────────────────────────────┐ │
                    │  │  LOCAL COMPANION SERVICE (Python / FastAPI)  │ │
                    │  │  Binds: 127.0.0.1:8765 only                 │ │
                    │  │  Auth: Pairing token (session-scoped)        │ │
                    │  │  Responsibilities:                           │ │
                    │  │    - Game state management                   │ │
                    │  │    - Save/load (SQLite, local files)         │ │
                    │  │    - AI provider abstraction                 │ │
                    │  │    - Input validation / guardrails           │ │
                    │  │    - Tool-call enforcement                   │ │
                    │  └─────────────────┬────────────────────────────┘ │
                    │                    │ localhost only               │
                    │  ┌─────────────────▼────────────────────────────┐ │
                    │  │  LM STUDIO (or compatible local runtime)     │ │
                    │  │  Binds: 127.0.0.1:1234 (default)            │ │
                    │  │  Protocol: OpenAI-compatible REST API         │ │
                    │  │  Model: Player-selected open-weight model    │ │
                    │  └──────────────────────────────────────────────┘ │
                    │                                                    │
                    └────────────────────────────────────────────────────┘
```

---

## Components

### 1. Public Frontend (`apps/web/`)

**Technology:** React 18, TypeScript, Vite, Tailwind CSS

**Deployment target:** Free static host (GitHub Pages first choice)

**What it does:**
- Renders all game UI
- Implements demo mode (fully deterministic, no companion needed)
- Manages local browser state (investigation progress for demo)
- Shows connection status for the local companion
- Provides setup and installation instructions

**What it does NOT do:**
- Run a server
- Hold private game state
- Contact any central AI API
- Contact any external service on behalf of the player

**Connection to companion:**
- User must explicitly click "Connect to Local Companion"
- Browser prompts user for the pairing token displayed by the companion
- CORS: companion allows only the exact published frontend origin + localhost dev origins
- The connection is optional; the demo works without it

---

### 2. Local Companion Service (`services/companion/`)

**Technology:** Python 3.12+, FastAPI, Pydantic, HTTPX, SQLite

**Runs on:** Player's machine, 127.0.0.1:8765

**What it does:**
- Maintains authoritative game state
- Manages save files (SQLite + JSON exports)
- Provides game API: locations, clues, characters, spells, verdict
- Connects to LM Studio (or compatible runtime) for AI features
- Validates all model outputs before returning to the frontend
- Enforces game rules independent of AI
- Exposes health and readiness endpoints

**What it does NOT do:**
- Bind to 0.0.0.0 (never exposes to LAN)
- Forward arbitrary requests to the model
- Allow the model to write to disk
- Expose environment variables via the API
- Act as a general proxy

**API surface (planned):**
```
GET  /health                  — Liveness
GET  /ready                   — Readiness (model status)
POST /session/new             — Start investigation
GET  /session/{id}            — Load session
GET  /locations               — List locations
GET  /locations/{id}          — Location detail
POST /actions/move            — Move to location
POST /actions/inspect         — Inspect clue
POST /actions/interview       — Interview character
POST /actions/cast            — Cast spell
POST /actions/search-archive  — Search lore archive
POST /actions/hypothesis      — Submit hypothesis
POST /actions/verdict         — Submit final verdict
GET  /ai/status               — Model status
POST /ai/dialogue             — Character dialogue (AI-enhanced)
GET  /saves                   — List saves
POST /saves/export            — Export save as JSON
DELETE /saves/{id}            — Delete save
```

---

### 3. LM Studio / AI Provider (`services/companion/app/ai/`)

**Abstraction layer supporting:**
- LM Studio (primary, OpenAI-compatible endpoint)
- Deterministic fallback (no model required)
- Future: Ollama, llamafile, or other compatible runtimes

**Provider interface:**
```python
class AIProvider(Protocol):
    async def check_available(self) -> bool: ...
    async def list_models(self) -> list[str]: ...
    async def chat(self, messages, tools, timeout) -> AIResponse: ...
    async def cancel_pending(self) -> None: ...
```

**Context construction:**
- Minimum context per request
- Character knowledge boundaries enforced before context is built
- Player text treated as untrusted
- Clue and lore text treated as untrusted
- System prompt kept separate from untrusted content

---

### 4. Game Engine (`services/companion/app/game/`)

**Deterministic. Never calls AI.**

Responsibilities:
- Case state machine (valid transitions only)
- Evidence discovery rules
- Spell prerequisite checks
- Verdict evaluation
- History recording
- Save and load

The engine is the single source of truth for:
- Which clues have been discovered
- Which characters have been interviewed
- Which locations are accessible
- Whether the verdict is correct
- What events have occurred

The model may *read* authorized game state but **never writes to it**.

---

### 5. Game Data (`game-data/`)

**Format:** JSON (validated by Pydantic schemas on load)

**Contents:**
- `cases/` — Mystery definitions (solution is server-side only)
- `characters/` — Character attributes and knowledge boundaries
- `locations/` — Location data, available clues, connections
- `spells/` — Spell definitions and effects
- `lore/` — Searchable fictional archive entries

**Principle:** The authoritative case solution is never sent to the frontend.

---

## Data Flows

### Demo Mode (no companion)
```
Browser → React game engine (deterministic) → Local browser state
```

### Connected Mode
```
Browser → (pairing token) → Companion API → Game Engine → Response
                                          ↓ (if AI action)
                                     AI Provider → LM Studio → Validated response
```

### Save Flow
```
Companion → SQLite (game_saves.db) → (export) → JSON file on player's disk
```

---

## Trust Boundaries

| Boundary | What crosses it | Controls |
|---|---|---|
| Internet → Public frontend | Static assets only | HTTPS, CSP headers, no secrets |
| Browser → Companion | Game API calls | CORS, pairing token, origin validation |
| Companion → LM Studio | Model requests | localhost only, timeout, output validation |
| Companion → Filesystem | Game data reads, save writes | Path validation, approved dirs only |
| Model → Game state | NEVER directly | Model output → validation → engine → state |

---

## Deployment Topology

### Development
```
Developer machine:
  - npm run dev (Vite, localhost:5173)
  - python -m uvicorn (companion, localhost:8765)
  - LM Studio (localhost:1234)
  - Podman Compose (optional, for containerized companion)
```

### Player (local install)
```
Player machine:
  - Browser → https://[published-frontend]
  - Python companion → python companion.py (localhost:8765)
  - LM Studio → running separately (localhost:1234)
```

### Public deployment
```
GitHub Pages: static frontend only
No backend, no model API, no player data
```

---

## Dependency Versions (pinned)

### Frontend (target)
- React 18.3.x
- TypeScript 5.x
- Vite 6.x
- Tailwind CSS 3.x

### Backend (target)
- Python 3.12+ (3.14.10 available locally)
- FastAPI 0.115.x
- Pydantic 2.x
- HTTPX 0.28.x
- uvicorn 0.32.x
- pytest 9.x

All versions pinned in `package.json` and `pyproject.toml`.

