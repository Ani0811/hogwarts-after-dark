import React, { useState } from 'react'
import { InvestigationSession } from '../types/game'
import { CLUES, LOCATIONS } from '../services/caseData'

interface EvidenceBoardProps {
  session: InvestigationSession
  onSubmitHypothesis: (hypothesis: string, evidenceIds: string[]) => void
}

export const EvidenceBoard: React.FC<EvidenceBoardProps> = ({ session, onSubmitHypothesis }) => {
  const [selectedForHypothesis, setSelectedForHypothesis] = useState<string[]>([])
  const [hypothesisText, setHypothesisText] = useState('')
  const [filter, setFilter] = useState<'all' | 'discovered' | 'unfound'>('all')

  const toggleSelect = (clueId: string) => {
    setSelectedForHypothesis(prev =>
      prev.includes(clueId) ? prev.filter(id => id !== clueId) : [...prev, clueId]
    )
  }

  const handleHypothesisSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!hypothesisText.trim()) return
    onSubmitHypothesis(hypothesisText.trim(), selectedForHypothesis)
    setHypothesisText('')
    setSelectedForHypothesis([])
  }

  const allClues = Object.values(CLUES)
  const discoveredCount = session.discoveredClueIds.length

  const filteredClues = allClues.filter(c => {
    const isDiscovered = session.discoveredClueIds.includes(c.id)
    if (filter === 'discovered') return isDiscovered
    if (filter === 'unfound') return !isDiscovered
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Evidence Dashboard Banner */}
      <div className="card" style={{ borderLeft: '4px solid var(--color-gold)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', color: 'var(--color-gold)', margin: 0 }}>
              The Investigator's Evidence Board
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', margin: '0.25rem 0 0 0' }}>
              Pin discovered artifacts, alchemical residues, and documents to synthesize investigative theories.
            </p>
          </div>
          <div style={{
            background: 'rgba(201, 168, 76, 0.15)',
            border: '1px solid var(--color-gold)',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-gold-bright)' }}>
              {discoveredCount} / {allClues.length}
            </div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
              Evidence Discovered
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          {(['all', 'discovered', 'unfound'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="btn btn-secondary"
              style={{
                fontSize: '0.8rem',
                padding: '0.25rem 0.65rem',
                background: filter === f ? 'rgba(201,168,76,0.2)' : 'transparent',
                borderColor: filter === f ? 'var(--color-gold)' : 'var(--color-border)'
              }}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Hypothesis Formulation Box */}
      <div className="card" style={{ background: 'rgba(20, 20, 42, 0.95)' }}>
        <h3 style={{ fontSize: '1.15rem', color: 'var(--color-gold)', marginBottom: '0.5rem' }}>
          <span>💡</span> Draft an Investigative Hypothesis
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
          Select discovered clues below to attach as backing evidence, then record your deduction.
        </p>

        <form onSubmit={handleHypothesisSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-gold)' }}>Attached Evidence:</span>
            {selectedForHypothesis.length === 0 ? (
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                (None pinned. Click "Pin to Hypothesis" on any discovered clue)
              </span>
            ) : (
              selectedForHypothesis.map(id => (
                <span
                  key={id}
                  style={{
                    background: 'rgba(74, 127, 203, 0.25)',
                    border: '1px solid var(--color-magic)',
                    color: 'var(--color-magic-bright)',
                    fontSize: '0.75rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  📌 {CLUES[id]?.title}
                  <span
                    onClick={() => toggleSelect(id)}
                    style={{ cursor: 'pointer', fontWeight: 'bold', marginLeft: '0.2rem' }}
                  >
                    ×
                  </span>
                </span>
              ))
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={hypothesisText}
              onChange={e => setHypothesisText(e.target.value)}
              placeholder="e.g., The thief obtained Dreamroot to incapacitate the archivist before moving the hourglass..."
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!hypothesisText.trim()}
            >
              Record Theory ➔
            </button>
          </div>
        </form>
      </div>

      {/* Clues Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {filteredClues.map(clue => {
          const isDiscovered = session.discoveredClueIds.includes(clue.id)
          const loc = LOCATIONS[clue.location_id]
          const isPinned = selectedForHypothesis.includes(clue.id)

          return (
            <div
              key={clue.id}
              className="card"
              style={{
                background: isDiscovered ? 'rgba(20, 20, 38, 0.95)' : 'rgba(12, 12, 22, 0.65)',
                border: isDiscovered
                  ? (isPinned ? '2px solid var(--color-magic-bright)' : '1px solid rgba(201, 168, 76, 0.35)')
                  : '1px dashed rgba(255, 255, 255, 0.15)',
                opacity: isDiscovered ? 1 : 0.7,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                    📍 {loc?.name || 'Unknown chamber'}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '3px',
                    background: isDiscovered ? 'rgba(64, 160, 96, 0.2)' : 'rgba(201, 128, 64, 0.2)',
                    color: isDiscovered ? 'var(--color-success)' : 'var(--color-warning)'
                  }}>
                    {isDiscovered ? '✓ Discovered' : '🔒 Unfound'}
                  </span>
                </div>

                <h3 style={{
                  fontSize: '1.15rem',
                  color: isDiscovered ? 'var(--color-gold-bright)' : 'var(--color-text-muted)',
                  marginTop: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  {isDiscovered ? clue.title : 'Unidentified Physical Evidence'}
                </h3>

                <p style={{
                  fontSize: '0.88rem',
                  color: isDiscovered ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  lineHeight: 1.6
                }}>
                  {isDiscovered ? clue.description : 'Search this chamber thoroughly or use revelation charms to expose this trace.'}
                </p>
              </div>

              {isDiscovered && (
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    {clue.tags.map(t => (
                      <span key={t} style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>
                        #{t}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => toggleSelect(clue.id)}
                    className="btn btn-secondary"
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.5rem',
                      borderColor: isPinned ? 'var(--color-magic)' : 'var(--color-gold-dim)',
                      color: isPinned ? 'var(--color-magic-bright)' : 'var(--color-gold)'
                    }}
                  >
                    {isPinned ? '✓ Pinned' : '📌 Pin to Theory'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

