# INSTALLATION.md — Player & Developer Installation Guide

---

## Playing Without Any Installation (Demo Mode)

You can play Hogwarts After Dark immediately without installing any software or models!
Simply open the published static frontend URL in any modern browser.

All five chambers, all clues, spells, the Marauder's Map, the Restricted Section, and the final verdict operate with full deterministic gameplay in Demo Mode.

---

## Enabling Local AI Dialogue via LM Studio

To unlock conversational AI dialogues with suspects, follow these steps to run inference locally on your own GPU/CPU with **zero subscription costs**.

### 1. Download & Launch LM Studio
1. Download [LM Studio](https://lmstudio.ai/) (available for Windows, macOS, and Linux).
2. Download an instruction-tuned model. Recommended models based on hardware:
   - **4 GB - 6 GB VRAM**: `Llama-3.2-3B-Instruct-GGUF` (Q4_K_M)
   - **8 GB - 12 GB VRAM**: `Qwen2.5-7B-Instruct-GGUF` or `Mistral-7B-Instruct-v0.3-GGUF`
   - **CPU only**: `Llama-3.2-1B-Instruct-GGUF`
3. Navigate to the **Developer / Local Server** tab in LM Studio.
4. Select your loaded model and click **Start Server**. Ensure the port is set to `1234` (default).

---

### 2. Run the Local Companion Service

#### Option A: Direct Python Execution (Recommended for Windows)
```bash
# Clone the repository
git clone https://github.com/your-username/hogwarts-after-dark.git
cd hogwarts-after-dark/services/companion

# Install dependencies
python -m pip install -e .

# Launch the companion service
python -m uvicorn app.main:create_app --factory --port 8765
```

The terminal will print:
```text
============================================================
  HOGWARTS AFTER DARK — Local Companion
  Listening on: http://127.0.0.1:8765
  AI Provider: LM Studio
  AI Available: True

  PAIRING TOKEN: [32-character-random-token]
============================================================
```

#### Option B: Running with Podman Desktop
```bash
cd deployment
podman compose up --build
```

---

### 3. Connect the Web Game to your Local Companion
1. Open the game in your web browser.
2. Click the **Local AI & Setup** tab in the navigation bar.
3. Paste the `PAIRING TOKEN` shown in your companion terminal.
4. Click **Save & Test Connection**.
5. The status pill will glow green: `Local AI: [Model Name] Ready`. You can now interrogate Maris, Corvin, and Faelind with live open-weight intelligence!
