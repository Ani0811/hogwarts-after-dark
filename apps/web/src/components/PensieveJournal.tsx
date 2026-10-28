import React from 'react'
import { InvestigationSession } from '../types/game'

interface PensieveJournalProps {
  session: InvestigationSession
  onReset: () => void
}

export const PensieveJournal: React.FC<PensieveJournalProps> = ({ session, onReset }) => {
  const exportSaveJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(session, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `hogwarts_after_dark_${session.sessionId}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Pensieve Basin Header */}
      <div className="arcane-panel arcane-panel--glass has-corners" style={{
        padding: '1.5rem 1.75rem',
        borderLeft: '4px solid var(--magic-cyan)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🕯️</span>
            <h2 style={{ fontSize: '1.6rem', margin: 0 }}>
              <span className="gold-gradient-text">The Pensieve of Memories</span>
            </h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.35rem 0 0 0' }}>
            A swirling basin of silvery recollections preserving every footsteps, interrogation, and magical residue detected.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button onClick={exportSaveJson} className="btn btn-stealth" style={{ fontSize: '0.8rem' }}>
            📥 Export Case Dossier
          </button>
          <button onClick={onReset} className="btn btn-danger" style={{ fontSize: '0.8rem' }}>
            🔄 Reset Case
          </button>
        </div>
      </div>

      {/* Recorded Hypotheses Shelf */}
      {session.hypotheses.length > 0 && (
        <div className="arcane-panel has-corners" style={{ padding: '1.5rem', background: 'rgba(16, 18, 34, 0.96)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.2rem' }}>💭</span>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--gold-bright)', margin: 0 }}>
              Synthesized Deductions ({session.hypotheses.length})
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {session.hypotheses.map((h, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(8, 9, 16, 0.75)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '6px',
                  padding: '1rem'
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  RECORDED AT {new Date(h.timestamp).toLocaleTimeString()}
                </div>
                <div className="font-lore" style={{ fontSize: '1.05rem', color: 'var(--text-heading)', margin: '0.4rem 0' }}>
                  "{h.hypothesis}"
                </div>
                {h.evidence_referenced && h.evidence_referenced.length > 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-gold)', marginTop: '0.4rem' }}>
                    <strong>Pinned Clues:</strong> {h.evidence_referenced.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chronological Event Log */}
      <div className="arcane-panel has-corners" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', color: 'var(--gold-bright)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>📜</span> Chronological Event Trace ({session.history.length})
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {session.history.slice().reverse().map((ev, idx) => {
            let icon = '•'
            let title = ev.event_type
            let details = ''

            if (ev.event_type === 'location_visited') {
              icon = '👣'
              title = `Traversed to ${ev.details.locationName || ev.details.locationId}`
            } else if (ev.event_type === 'clue_discovered') {
              icon = '✨'
              title = `Uncovered Physical Clue: ${ev.details.title || ev.details.clueId}`
            } else if (ev.event_type === 'spell_cast') {
              icon = '🪄'
              title = `Cast Charm: ${ev.details.spellName || ev.details.spellId}`
              details = ev.details.revealed?.length ? `Revealed: ${ev.details.revealed.join(', ')}` : ''
            } else if (ev.event_type === 'character_interviewed') {
              icon = '💬'
              title = `Interrogated ${ev.details.name || ev.details.characterId}`
              details = `Inquiry: "${ev.details.question}"`
            } else if (ev.event_type === 'hypothesis_submitted') {
              icon = '💡'
              title = 'Synthesized Investigation Theory'
              details = `"${ev.details.hypothesis}"`
            } else if (ev.event_type === 'verdict_submitted') {
              icon = '⚖️'
              title = `Delivered Final Indictment (${ev.details.correct ? 'CASE SOLVED' : 'VERDICT REJECTED'})`
              details = `Accused: ${ev.details.culpritId}`
            }

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.85rem',
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(8, 9, 16, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '6px'
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>{icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '0.9rem' }}>
                      {title}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {details && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {details}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
