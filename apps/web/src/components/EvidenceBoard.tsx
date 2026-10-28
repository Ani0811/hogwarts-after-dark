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
      <div className="arcane-panel arcane-panel--glass has-corners" style={{
        padding: '1.5rem 1.75rem',
        borderLeft: '4px solid var(--gold-pure)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.4rem' }}>📜</span>
            <h2 style={{ fontSize: '1.6rem', margin: 0 }}>
              <span className="gold-gradient-text">The Auror's Evidence Board</span>
            </h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.35rem 0 0 0' }}>
            Pin discovered artifacts, alchemical residues, and documents to synthesize formal hypotheses.
          </p>
        </div>

        {/* Discovery Progress Meter */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          background: 'rgba(10, 11, 20, 0.8)',
          border: '1px solid var(--gold-border)',
          padding: '0.65rem 1.25rem',
          borderRadius: '8px'
        }}>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              DOSSIER RECOVERY
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--gold-bright)', lineHeight: 1.1 }}>
              {discoveredCount} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ {allClues.length} CLUES</span>
            </div>
          </div>
          <div style={{
            width: '80px',
            height: '6px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(discoveredCount / allClues.length) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--gold-pure), var(--gold-bright))'
            }} />
          </div>
        </div>
      </div>

      {/* Hypothesis Formulation Workshop */}
      <div className="arcane-panel has-corners" style={{ padding: '1.5rem', background: 'rgba(16, 18, 32, 0.95)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '1.2rem' }}>💡</span>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--gold-bright)', margin: 0 }}>
            Synthesize an Investigative Hypothesis
          </h3>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Pin discovered evidence items below, write your investigative deduction, and commit it to the Pensieve archives.
        </p>

        <form onSubmit={handleHypothesisSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Pinned Evidence Shelf */}
          <div style={{
            background: 'rgba(8, 9, 16, 0.7)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            borderRadius: '6px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-gold)', letterSpacing: '0.05em' }}>
              PINNED EVIDENCE:
            </span>
            {selectedForHypothesis.length === 0 ? (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                (None pinned. Click "Pin to Theory" on any discovered clue card below)
              </span>
            ) : (
              selectedForHypothesis.map(id => (
                <span
                  key={id}
                  style={{
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid var(--magic-cyan)',
                    color: 'var(--magic-cyan-bright)',
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontWeight: 600
                  }}
                >
                  📌 {CLUES[id]?.title}
                  <span
                    onClick={() => toggleSelect(id)}
                    style={{ cursor: 'pointer', opacity: 0.7, padding: '0 0.15rem' }}
                    title="Unpin"
                  >
                    ×
                  </span>
                </span>
              ))
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <input
              type="text"
              value={hypothesisText}
              onChange={e => setHypothesisText(e.target.value)}
              placeholder="e.g. Corvin acquired Dreamroot to drug the Archivist and steal the Hourglass to reverse his failed thesis..."
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              className="btn btn-gold"
              disabled={!hypothesisText.trim()}
              style={{ padding: '0.65rem 1.25rem' }}
            >
              Record Theory ➔
            </button>
          </div>
        </form>
      </div>

      {/* Filter Tabs & Clues Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid var(--gold-border)', paddingBottom: '0.5rem' }}>
          {[
            { id: 'all', label: `All Evidence (${allClues.length})` },
            { id: 'discovered', label: `Discovered (${discoveredCount})` },
            { id: 'unfound', label: `Unsolved Traces (${allClues.length - discoveredCount})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`nav-pill ${filter === tab.id ? 'nav-pill--active' : ''}`}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Evidence Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredClues.map(clue => {
            const isDiscovered = session.discoveredClueIds.includes(clue.id)
            const loc = LOCATIONS[clue.location_id]
            const isPinned = selectedForHypothesis.includes(clue.id)

            return (
              <div
                key={clue.id}
                className="arcane-panel has-corners"
                style={{
                  background: isDiscovered ? 'rgba(16, 18, 32, 0.95)' : 'rgba(10, 11, 20, 0.7)',
                  borderColor: isPinned
                    ? 'var(--magic-cyan)'
                    : isDiscovered
                    ? 'rgba(212, 175, 55, 0.45)'
                    : 'rgba(255, 255, 255, 0.1)',
                  boxShadow: isPinned
                    ? '0 0 16px var(--magic-glow)'
                    : isDiscovered
                    ? 'var(--shadow-card)'
                    : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1.25rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-gold)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      📍 {loc?.name || 'Unknown chamber'}
                    </span>
                    <span className={`badge ${isDiscovered ? 'badge-emerald' : 'badge-charcoal'}`}>
                      {isDiscovered ? '✓ DISCOVERED' : '🔒 CONCEALED'}
                    </span>
                  </div>

                  <h3 style={{
                    fontSize: '1.18rem',
                    color: isDiscovered ? 'var(--gold-bright)' : 'var(--text-muted)',
                    marginBottom: '0.5rem',
                    lineHeight: 1.3
                  }}>
                    {isDiscovered ? clue.title : 'Unsolved Physical Evidence'}
                  </h3>

                  <p className="font-lore" style={{
                    fontSize: '1rem',
                    color: isDiscovered ? 'var(--text-body)' : 'var(--text-muted)',
                    lineHeight: 1.6,
                    margin: 0
                  }}>
                    {isDiscovered
                      ? clue.description
                      : 'Search the corresponding chamber or employ revelation spells to unmask this trace.'}
                  </p>
                </div>

                {isDiscovered && (
                  <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                      {clue.tags.map(t => (
                        <span key={t} style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.4rem', borderRadius: '3px' }}>
                          #{t}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => toggleSelect(clue.id)}
                      className={`btn ${isPinned ? 'btn-magic' : 'btn-stealth'}`}
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
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
    </div>
  )
}
