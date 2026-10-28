# SECURITY.md — Hogwarts After Dark

> Version: 0.1.0 | Phase: 0

---

## Reporting Security Issues

If you discover a security vulnerability in Hogwarts After Dark, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Email: [maintainer email — set before public release]

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested mitigations

We aim to acknowledge reports within 48 hours and provide an initial assessment within 7 days.

---

## Security Architecture Summary

This application has an unusual architecture that affects its security profile significantly:

1. **The public website is static** — There is no server-side code on the public deployment. Compromising the hosting provider does not expose player data or game saves.

2. **AI runs locally** — No player conversation data is sent to a central AI service. The model runs on the player's own machine.

3. **The companion is local-only** — The Python companion binds to `127.0.0.1` only. It is not exposed to the internet.

4. **No central database** — Player saves are stored locally on the player's machine in SQLite format.

---

## Supported Configuration

### Safe configuration

```
Frontend: https://[host]/hogwarts-after-dark  (HTTPS, served by CDN/Pages)
Companion: http://127.0.0.1:8765               (localhost only, never exposed)
LM Studio: http://127.0.0.1:1234               (localhost only, player-managed)
```

### Unsupported / unsafe configurations

The following configurations are NOT supported and are explicitly discouraged:

- Exposing the companion on `0.0.0.0` or any non-loopback interface
- Exposing LM Studio on a public or LAN interface
- Running the companion as root
- Disabling CORS validation
- Disabling origin header validation
- Removing the pairing token requirement
- Deploying the companion to a cloud server
- Hardcoding authentication credentials

If you operate the companion in an unsupported configuration, you accept full responsibility for any resulting security issues.

---

## What the Companion Stores

| Data | Where | Retention | Export |
|---|---|---|---|
| Game session state | SQLite (`game_saves.db`) | Until player deletes | JSON export |
| Conversation history | In-memory (session) | Cleared on restart | Not saved by default |
| Model configuration | Config file | Until changed | Manual |
| Application logs | Log file | 7-day rolling | Manual |

**The companion does NOT store:**
- Full conversation transcripts by default
- Player-supplied document contents
- API keys or credentials in the save file
- The case solution in the save file

---

## Known Security Limitations

| Limitation | Risk | Notes |
|---|---|---|
| WSL2 container boundary | Low-Medium | Weaker than hardware VM. Documented. |
| Python 3.14 tool support | Low | Some security scanners may not support this version yet |
| Browser HTTPS → HTTP companion | Medium | Browsers may block mixed content. Use companion-served UI for full functionality or configure HTTPS locally. |
| Local pairing token visible in terminal | Low | Any local process can read terminal output. Accept for local-only service. |
| No mutual TLS for companion | Low | Impractical for local install; mitigated by pairing token |

---

## Browser Mixed Content Note

Modern browsers block HTTPS pages from making HTTP requests to localhost services. This is a privacy protection.

Hogwarts After Dark addresses this in two ways:

1. **Demo mode** — Always available without the companion. No HTTP request needed.
2. **Companion-served UI option** — The companion can serve the frontend locally over HTTP, eliminating the mixed-content issue for connected mode.

We do NOT recommend disabling browser security settings to work around this limitation.

---

## Dependency Security

Dependencies are reviewed at each release:

```bash
# Frontend
npm audit

# Backend  
pip-audit  # where compatible with installed Python version

# Containers
podman scan [image]  # where available
```

A clean `npm audit` or `pip-audit` result does not guarantee security. It means no known published CVEs match the current dependencies.

---

## Build and Release Security

- Build artifacts are created by CI (GitHub Actions) from a clean checkout
- No production credentials are stored in the repository
- GitHub Actions uses minimal token permissions
- The published frontend contains no API keys, tokens, or private data
- Container images do not include `.env` files

---

## Responsible Disclosure History

| Date | Issue | Resolution |
|---|---|---|
| — | No reports received yet | — |

