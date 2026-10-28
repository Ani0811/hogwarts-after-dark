# DEPLOYMENT.md — Hogwarts After Dark Deployment Guide

> Target: Zero-Budget Public Static Hosting (GitHub Pages / Cloudflare Pages) + Local Companion

---

## Architecture Summary

Hogwarts After Dark intentionally separates the **public presentation layer** from the **private execution & AI layer**:

1. **Public Frontend (Static)**:
   - Hosted on GitHub Pages (Free Tier)
   - Zero server-side code, zero database dependencies, zero central AI keys
   - Contains a complete in-browser deterministic investigation engine (Demo Mode)

2. **Local Companion (Private/Local)**:
   - Python 3.12+ FastAPI service running exclusively on the player's loopback interface (`127.0.0.1:8765`)
   - Manages local SQLite save states and communicates with local LM Studio instances on `127.0.0.1:1234`
   - Requires pairing authentication via a random session token displayed on startup

---

## Deploying the Frontend to GitHub Pages

### Prerequisites
- A GitHub repository containing the codebase
- Actions enabled in repository settings

### Automatic CI/CD Deployment
1. Push to the `main` branch.
2. In your GitHub repository, navigate to **Settings > Pages**.
3. Under **Build and deployment > Source**, select **GitHub Actions**.
4. The workflow at `.github/workflows/deploy.yml` will automatically build the React application with `VITE_BASE_PATH=/hogwarts-after-dark/` and deploy the static artifacts.
5. Your public game will be live at:
   `https://<your-username>.github.io/hogwarts-after-dark/`

### Manual Production Build
To produce the standalone static distribution locally:
```bash
cd apps/web
npm install
npm run build
```
The deployable assets will be located in `apps/web/dist/`.

---

## Running with Podman / Docker (Local Companion)

A containerized configuration is provided for cross-platform local execution:

```bash
cd deployment
podman compose up --build
```
This launches:
- `had-companion` at `http://127.0.0.1:8765`
- `had-web` at `http://127.0.0.1:8080`

The container connects to the Windows host LM Studio instance via `host.containers.internal:1234`.
