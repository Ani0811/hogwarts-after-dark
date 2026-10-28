# TROUBLESHOOTING.md — Hogwarts After Dark Diagnostics & FAQs

---

## 1. Browser Connection: "Companion Disconnected (Running in Demo Mode)"

### Cause A: Companion service is not running
**Solution:** Ensure `uvicorn` or Podman is active. Verify by visiting `http://127.0.0.1:8765/health` directly in your browser. It should return JSON with `"status": "ok"`.

### Cause B: Mixed Content Blocking (HTTPS vs HTTP localhost)
When the frontend is accessed over `https://` (e.g. on GitHub Pages), modern browser security restrictions (Private Network Access / Mixed Content) may block background requests to `http://127.0.0.1:8765`.
**Solutions:**
- Run the web app locally using `npm run dev` or the containerized `http://127.0.0.1:8080` where both origins share HTTP.
- Alternatively, use the standalone in-browser Demo Mode which requires zero companion connections.

---

## 2. AI Connection: "No Model Loaded / AI Offline"

### Cause: LM Studio server is running, but no model is selected in memory
**Solution:**
1. Open LM Studio.
2. In the top bar or server tab, select a model from your downloaded library and click **Load Model**.
3. Verify the server indicator says `Server is ON` on `http://localhost:1234`.

---

## 3. "Invalid or Missing Pairing Token" (HTTP 401)

### Cause: State-changing requests sent without the current session pairing token
**Solution:**
Each time the companion restarts, it generates a fresh random token for defense against malicious cross-origin websites. Copy the new `PAIRING TOKEN` printed in the companion terminal and update it under the **Local AI & Setup** tab.

---

## 4. Spells Fail: "Insufficient Mana"

### Cause: Casting spells consumes Magical Focus (MP)
**Solution:**
Lumos costs 1 MP, Revelio costs 2 MP, Specialis Revelio costs 3 MP, and Memoria Vestigium costs 5 MP. If you deplete your 20 MP pool, consider resetting the case from the Pensieve tab.

---

## 5. Corrupted Game Saves

### Cause: Old schema or corrupted JSON in browser localStorage
**Solution:**
1. Open the browser Developer Tools (F12) > Application > Local Storage.
2. Clear the key `had_investigation_session`.
3. Refresh the page to initialize a clean investigation.
