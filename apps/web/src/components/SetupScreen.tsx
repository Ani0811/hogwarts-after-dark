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
    setSaveMessage('Credentials saved! Pinging companion service...')
    onRefreshCompanion()
    setTimeout(() => setSaveMessage(''), 3500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Title & Vision Banner */}
      <div className="arcane-panel arcane-panel--glass has-corners" style={{
        padding: '1.75rem',
        borderLeft: '4px solid var(--gold-pure)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '1.5rem' }}>⚡</span>
          <h2 style={{ fontSize: '1.75rem', margin: 0 }}>
            <span className="gold-gradient-text">Arcane AI Engine & Companion Setup</span>
          </h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.45rem', lineHeight: 1.6 }}>
          Hogwarts After Dark is engineered with an uncompromising <strong>zero-budget, privacy-first local architecture</strong>.
          There are <strong>no paid API keys</strong>, no cloud GPU subscriptions, and zero external telemetry.
          Inference runs exclusively on your own machine through local open-weight language models.
        </p>
      </div>

      {/* Diagnostics & Live Telemetry Panel */}
      <div className="arcane-panel has-corners" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', color: 'var(--gold-bright)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>📡</span> Live Runtime Telemetry
        </h3>

        <div style={{
          padding: '1.25rem',
          borderRadius: '8px',
          background: companionStatus.connected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
          border: `1px solid ${companionStatus.connected ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className={`status-dot ${companionStatus.connected ? 'status-dot--online' : 'status-dot--amber'}`} />
              <strong style={{ color: companionStatus.connected ? '#6ee7b7' : '#fde68a', fontSize: '0.95rem' }}>
                {companionStatus.connected ? 'LOCAL COMPANION CONNECTED' : 'STANDALONE DEMO MODE (OFFLINE)'}
              </strong>
            </div>

            <button onClick={onRefreshCompanion} className="btn btn-stealth" style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}>
              🔄 Re-Check Health
            </button>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-heading)', lineHeight: 1.6 }}>
            {companionStatus.connected ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SERVICE ENDPOINT</div>
                  <strong>{companionStatus.url}</strong>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ACTIVE MODEL</div>
                  <strong style={{ color: 'var(--magic-cyan-bright)' }}>{companionStatus.aiModel || 'Detecting...'}</strong>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>VERSION</div>
                  <strong>v{companionStatus.version}</strong>
                </div>
              </div>
            ) : (
              <div>
                The local companion service is not currently running at <code>{companionStatus.url}</code>.
                <br />
                The game is currently operating in <strong>Full In-Browser Demo Mode</strong>:
                every chamber, environmental clue, spell effect, and verdict evaluation works deterministically in your browser!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pairing Credentials Form */}
      <div className="arcane-panel has-corners" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', color: 'var(--gold-bright)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🔐</span> Companion Service Credentials
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Configure loopback URL and pairing token for authorized browser-to-companion communication.
        </p>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div>
            <label>Companion API Base URL (Loopback Only):</label>
            <input
              type="text"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="http://127.0.0.1:8765"
            />
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              For security, the companion binds exclusively to 127.0.0.1. It is never exposed over public networks.
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
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              Generated upon terminal launch to prevent unauthorized website cross-origin attacks.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button type="submit" className="btn btn-gold">
              💾 Save & Test Connection
            </button>
            {saveMessage && (
              <span style={{ fontSize: '0.85rem', color: 'var(--gold-bright)' }}>
                {saveMessage}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Step-by-Step Local AI Setup */}
      <div className="arcane-panel has-corners" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', color: 'var(--gold-bright)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🚀</span> Step-by-Step Local AI Guide
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.88rem' }}>
          <div>
            <strong style={{ color: 'var(--text-heading)' }}>Step 1: Start LM Studio</strong>
            <p style={{ color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Download and launch <a href="https://lmstudio.ai" target="_blank" rel="noreferrer" style={{ color: 'var(--magic-cyan-bright)' }}>LM Studio</a>.
              Load any instruction model (e.g. <code>Llama-3.2-3B-Instruct</code> or <code>Qwen2.5-7B</code>) and start the local server on port <code>1234</code>.
            </p>
          </div>

          <div>
            <strong style={{ color: 'var(--text-heading)' }}>Step 2: Start the Local Companion Service</strong>
            <pre style={{
              background: '#06070e',
              border: '1px solid var(--gold-border)',
              borderRadius: '6px',
              padding: '0.85rem',
              color: 'var(--gold-bright)',
              fontSize: '0.82rem',
              marginTop: '0.35rem',
              fontFamily: 'var(--font-mono)'
            }}>
cd services/companion
python -m uvicorn app.main:create_app --factory --port 8765
            </pre>
          </div>

          <div>
            <strong style={{ color: 'var(--text-heading)' }}>Step 3: Copy the Session Pairing Token</strong>
            <p style={{ color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Copy the <code>PAIRING TOKEN</code> displayed in your terminal upon launch, paste it above, and click <strong>Save & Test Connection</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
