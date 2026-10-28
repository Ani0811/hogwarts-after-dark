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
      <div className="card" style={{ borderLeft: '4px solid var(--color-magic)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', color: 'var(--color-gold)', margin: 0 }}>
              The Pensieve of Memories
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', margin: '0.25rem 0 0 0' }}>
              A swirling basin of silvery recollections preserving every footsteps, interrogation, and magical residue detected.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={exportSaveJson} className="btn btn-secondary">
              📥 Export Case Dossier
            </button>
            <button onClick={onReset} className="btn btn-danger">
              🔄 Reset Case
            </button>
          </div>
        </div>
      </div>

      {/* Recorded Hypotheses Summary */}
      {session.hypotheses.length > 0 && (
        <div className="card" style={{ background: 'rgba(20, 20, 40, 0.95)' }}>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--color-gold-bright)', marginBottom: '0.75rem' }}>
            <span>💭</span> Synthesized Theories ({session.hypotheses.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {session.hypotheses.map((h, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(10, 10, 25, 0.6)',
                  border: '1px solid rgba(201,168,76,0.2)',
                  borderRadius: '6px',
                  padding: '0.75rem 1rem'
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  {new Date(h.timestamp).toLocaleTimeString()}
                </div>
                <div style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)', marginTop: '0.25rem' }}>
                  "{h.hypothesis}"
                </div>
                {h.evidence_referenced && h.evidence_referenced.length > 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-gold)', marginTop: '0.4rem' }}>
                    Referenced Clues: {h.evidence_referenced.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chronological Event Log */}
      <div className="card">
        <h3 style={{ fontSize: '1.2rem', color: 'var(--color-gold)', marginBottom: '1rem' }}>
          <span>📜</span> Event Chronicle
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {session.history.slice().reverse().map((ev, idx) => {
            let icon = '•'
            let title = ev.event_type
            let details = JSON.stringify(ev.details)

            if (ev.event_type === 'location_visited') {
              icon = '👣'
              title = `Traversed to ${ev.details.locationName || ev.details.locationId}`
              details = ''
            } else if (ev.event_type === 'clue_discovered') {
              icon = '✨'
              title = `Uncovered Evidence: ${ev.details.title || ev.details.clueId}`
              details = ''
            } else if (ev.event_type === 'spell_cast') {
              icon = '🪄'
              title = `Cast Charm: ${ev.details.spellName || ev.details.spellId}`
              details = ev.details.revealed?.length ? `Revealed: ${ev.details.revealed.join(', ')}` : ''
            } else if (ev.event_type === 'character_interviewed') {
              icon = '💬'
              title = `Interrogated: ${ev.details.name || ev.details.characterId}`
              details = `Question: "${ev.details.question}"`
            } else if (ev.event_type === 'hypothesis_submitted') {
              icon = '💡'
              title = 'Recorded Investigation Theory'
              details = `"${ev.details.hypothesis}"`
            } else if (ev.event_type === 'verdict_submitted') {
              icon = '⚖️'
              title = `Submitted Final Accusation (${ev.details.correct ? 'SOLVED' : 'INCORRECT'})`
              details = `Target: ${ev.details.culpritId}`
            }

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid rgba(255,255,255,0.05)'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-heading)', fontSize: '0.9rem' }}>
                      {title}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {details && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
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
