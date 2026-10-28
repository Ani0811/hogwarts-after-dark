# 🔮 HOGWARTS AFTER DARK
### A Supernatural Magical Investigation Game Powered by Local Open-Weight AI

[![CI & Security Quality Gate](https://github.com/your-username/hogwarts-after-dark/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/hogwarts-after-dark/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-gold.svg)](LICENSE)
[![Zero-Budget Architecture](https://img.shields.io/badge/Budget-%E2%82%B90%20Zero%20Paid%20APIs-blue.svg)](#zero-budget-architecture)
[![Local AI](https://img.shields.io/badge/AI-LM%20Studio%20Local%20Inference-green.svg)](#local-ai-integration)

> An atmospheric fan-inspired detective investigation where the player examines enchanted artifacts, questions suspects, casts investigative spells, and submits formal verdicts. Powered by local open-weight language models with **zero central AI subscription costs** and a **100% playable offline fallback**.

---

## 🧭 The Four Core Pillars

1. **The Marauder's Map**: An interactive top-down spatial floorplan tracking rooms, secret corridors, and the nocturnal positions of suspects.
2. **The Restricted Section**: A searchable magical compendium of ancient grimoires, poisons, and chronomancy treatises.
3. **The Pensieve of Memories**: A persistent, tamper-resistant chronicle recording every footstep, spell casting, clue discovery, and hypothesis.
4. **Haunted Investigations**: Supernatural mysteries with pre-determined authoritative solutions that cannot be hallucinated, rewritten, or leaked by the language model.

---

## ⚖️ Intellectual Property Notice

This is an unofficial, non-commercial fan project inspired by the Harry Potter universe.

*"Harry Potter"* and associated marks are registered trademarks of Warner Bros. Entertainment Inc. and J.K. Rowling. This project is **not affiliated with, endorsed by, or sponsored by Warner Bros., J.K. Rowling, or any franchise rights holders.** All case lore, dialogue, code, and investigative scenarios are original works created for educational and interactive storytelling purposes.

---

## 🏛️ System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│ PUBLIC STATIC FRONTEND (React 18 + TypeScript + Vite)                  │
│ Hosted on Free GitHub Pages / Cloudflare Pages                         │
│ • Complete In-Browser Deterministic Engine (100% Playable Demo Mode)   │
│ • No Paid APIs • No Central Telemetry                                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Optional Pairing
                                    ▼ (127.0.0.1:8765)
┌────────────────────────────────────────────────────────────────────────┐
│ LOCAL COMPANION SERVICE (Python 3.12+ FastAPI)                         │
│ Runs exclusively on the player's loopback interface                    │
│ • Strict Session-Scoped Pairing Token Authentication                   │
│ • DNS Rebinding & Host Validation • Request Throttling                 │
│ • Authoritative Game State Engine • SQLite Save Storage                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Localhost Only
                                    ▼ (127.0.0.1:1234)
┌────────────────────────────────────────────────────────────────────────┐
│ LM STUDIO (Open-Weight Model Runtime on Player Hardware)               │
│ • Llama-3.2, Qwen-2.5, Mistral • Runs on Consumer GPU/CPU              │
│ • Bounded Context Construction • Clue Citation Verification            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### 1. Play Instantly in Your Browser (No Installation)
Visit the live static web app at `https://<your-username>.github.io/hogwarts-after-dark/`.
All rooms, clues, spells, and the complete mystery can be solved right in your browser in **Demo Mode**.

### 2. Enable Live Local AI Dialogue
1. Launch [LM Studio](https://lmstudio.ai/) and start the local server on `http://127.0.0.1:1234` with an open-weight model (e.g. `Llama-3.2-3B-Instruct` or `Qwen2.5-7B`).
2. Clone this repository and run the local companion:
   ```bash
   cd services/companion
   python -m pip install -e .
   python -m uvicorn app.main:create_app --factory --port 8765
   ```
3. Copy the random `PAIRING TOKEN` printed in the terminal.
4. On the game's **Local AI & Setup** tab, paste the token and click **Save & Test Connection**.

---

## 🛡️ Security & AI Guardrails

Hogwarts After Dark is hardened with multi-tier application security:

- **Authoritative Separation**: The language model never owns game state or the case solution. The answer is evaluated deterministically in Python application code.
- **DNS Rebinding Protection**: Host headers are strictly verified against loopback addresses (`127.0.0.1`, `localhost`, `[::1]`).
- **CSRF / Origin Isolation**: State-changing endpoints require an unpredictable, session-scoped pairing token (`X-Pairing-Token`).
- **Path Traversal Defense**: All entity IDs are validated against strict alphanumeric patterns (`^[a-z][a-z0-9_]{1,63}$`).
- **XSS & Output Sanitization**: Model-generated dialogue is stripped of script tags, event handlers, and HTML elements before presentation.
- **Prompt Injection Immunity**: Player messages and clue descriptions are treated as untrusted data blocks delimited in context, preventing instructions like *"ignore previous instructions"* from overriding system rules.

---

## 🧪 Automated Testing

Run the automated test suite across all security regression and playthrough scenarios:

```bash
# Run all backend security, playthrough, and data validation tests
python -m pytest tests/ -v --tb=short

# Run frontend type-checking and build
cd apps/web
npm run build
```

---

## 📄 Documentation Index

- [Architecture & Data Flows](docs/ARCHITECTURE.md)
- [Threat Model & Attack Surface](docs/THREAT_MODEL.md)
- [Security Policy & Disclosures](docs/SECURITY.md)
- [AI Guardrails & Context Rules](docs/AI_GUARDRAILS.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Installation Guide](docs/INSTALLATION.md)
- [Diagnostics & Troubleshooting](docs/TROUBLESHOOTING.md)
- [Project Status & Milestones](PROJECT_STATUS.md)

---

## 📜 License

Software is licensed under the [MIT License](LICENSE).
Open-weight AI models run locally are subject to their respective creators' community licenses.
