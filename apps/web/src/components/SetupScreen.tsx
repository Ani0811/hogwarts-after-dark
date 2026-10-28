import React, { useState } from 'react'
import { CompanionStatus } from '../types/game'
import { gameService } from '../services/api'

interface SetupScreenProps {
  companionStatus: CompanionStatus
  onRefreshCompanion: () => void
}

export const SetupScreen: React.FC<SetupScreenProps> = ({
  companionStatus,
  onRefreshCompanion
}) => {
  const [urlInput, setUrlInput] = useState(gameService.getCompanionUrl())
  const [tokenInput, setTokenInput] = useState(gameService.getPairingToken())
  const [saveMessage, setSaveMessage] = useState('')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    gameService.setCompanionUrl(urlInput)
    gameService.setPairingToken(tokenInput)
    setSaveMessage('Settings saved! Testing connection...')
    onRefreshCompanion()
    setTimeout(() => setSaveMessage(''), 3000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '850px', margin: '0 auto' }}>
      <div className="card" style={{ borderLeft: '4px solid var(--color-gold)' }}>
        <h2 style={{ fontSize: '1.75rem', color: 'var(--color-gold-bright)', margin: 0 }}>
          Local AI Companion & Setup Guide
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem', lineHeight: 1.6 }}>
          Hogwarts After Dark is engineered with a strict <strong>zero-budget, privacy-first architecture</strong>.
          There are <strong>no paid API keys</strong>, no central telemetry servers, and no cloud GPU dependencies.
          Inference runs exclusively on your own computer via open-weight AI models.
        </p>
      </div>

      {/* Connection Config Form */}
      <div className="card" style={{ background: 'rgba(18, 18, 36, 0.95)' }}>
        <h3 style={{ fontSize: '1.25rem', color: 'var(--color-gold)', marginBottom: '1rem' }}>
          🔌 Companion Service Connection
        </h3>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label>Companion API URL (Loopback Interface Only):</label>
            <input
              type="text"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="http://127.0.0.1:8765"
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              For security, the companion binds only to 127.0.0.1. It is never exposed over public networks.
            </div>
          </div>

          <div>
            <label>Session Pairing Token:</label>
            <input
              type="password"
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              placeholder="Paste pairing token displayed in companion terminal..."
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              The companion displays a one-time random pairing token upon terminal launch to prevent unauthorized website cross-talk.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button type="submit" className="btn btn-primary">
              💾 Save & Test Connection
            </button>
            <button type="button" onClick={onRefreshCompanion} className="btn btn-secondary">
              🔄 Check Health Now
            </button>
            {saveMessage && (
              <span style={{ fontSize: '0.85rem', color: 'var(--color-gold)' }}>
                {saveMessage}
              </span>
            )}
          </div>
        </form>

        {/* Live Diagnostics Card */}
        <div style={{
          marginTop: '1.25rem',
          padding: '1rem',
          borderRadius: '6px',
          background: companionStatus.connected ? 'rgba(64,160,96,0.1)' : 'rgba(201,128,64,0.1)',
          border: `1px solid ${companionStatus.connected ? 'var(--color-success)' : 'var(--color-warning)'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <span className={`status-dot ${companionStatus.connected ? 'status-dot--online' : 'status-dot--unknown'}`} />
            <span>Connection Status: {companionStatus.connected ? 'COMPANION ACTIVE' : 'COMPANION OFFLINE (DEMO MODE)'}</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.4rem', lineHeight: 1.5 }}>
            {companionStatus.connected ? (
              <>
                Companion Version: <strong>{companionStatus.version}</strong> •
                AI Status: <strong>{companionStatus.aiAvailable ? 'Model Ready' : 'Runtime Idle / No Model'}</strong>
                {companionStatus.aiModel && ` • Model: ${companionStatus.aiModel}`}
              </>
            ) : (
              <>
                The companion service was not detected at <code>{companionStatus.url}</code>.
                <br />
                The game is currently running in <strong>Full In-Browser Demo Mode</strong>:
                all gameplay, clues, spells, locations, and verdicts operate with 100% functionality using the deterministic engine!
              </>
            )}
          </div>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="card">
        <h3 style={{ fontSize: '1.25rem', color: 'var(--color-gold)', marginBottom: '1rem' }}>
          🚀 How to Run the Local AI Companion
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
          <div>
            <strong>Step 1: Start LM Studio (or compatible runtime)</strong>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-secondary)' }}>
              Download and launch <a href="https://lmstudio.ai" target="_blank" rel="noreferrer">LM Studio</a>. Load any instruction-tuned open-weight model (such as Llama 3.2 3B, Qwen 2.5 7B, or Mistral 7B). Start the local inference server on port <code>1234</code>.
            </p>
          </div>

          <div>
            <strong>Step 2: Start the Python Companion Service</strong>
            <p style={{ margin: '0.25rem 0 0.5rem 0', color: 'var(--color-text-secondary)' }}>
              Open your terminal inside the repository and start the companion:
            </p>
            <pre style={{
              background: '#0a0a14',
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid var(--color-border)',
              color: 'var(--color-gold-bright)',
              fontSize: '0.85rem'
            }}>
cd services/companion
python -m uvicorn app.main:create_app --factory --port 8765
            </pre>
          </div>

          <div>
            <strong>Step 3: Copy the Pairing Token</strong>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-secondary)' }}>
              Upon startup, the companion terminal will output:
              <br />
              <code style={{ color: 'var(--color-gold)' }}>PAIRING TOKEN: [your-session-token]</code>
              <br />
              Paste this token into the pairing box above and click Save. That's all!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

