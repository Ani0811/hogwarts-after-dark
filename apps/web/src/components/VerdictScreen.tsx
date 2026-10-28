import React, { useState } from 'react'
import { InvestigationSession } from '../types/game'
import { CHARACTERS, CLUES } from '../services/caseData'

interface VerdictScreenProps {
  session: InvestigationSession
  onSubmitVerdict: (culpritId: string, evidenceIds: string[]) => Promise<{ correct: boolean; message: string }>
}

export const VerdictScreen: React.FC<VerdictScreenProps> = ({ session, onSubmitVerdict }) => {
  const [selectedCulprit, setSelectedCulprit] = useState<string>('')
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([])
  const [verdictResult, setVerdictResult] = useState<{ correct: boolean; message: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const suspects = Object.values(CHARACTERS).filter(c => c.is_suspect)
  const discoveredClues = session.discoveredClueIds.map(id => CLUES[id]).filter(Boolean)

  const toggleEvidence = (id: string) => {
    setSelectedEvidence(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCulprit || submitting) return

    setSubmitting(true)
    try {
      const res = await onSubmitVerdict(selectedCulprit, selectedEvidence)
      setVerdictResult(res)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div className="arcane-panel arcane-panel--glass has-corners" style={{
        padding: '1.75rem',
        borderLeft: '4px solid var(--gold-pure)',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '1.85rem', margin: 0 }}>
          <span className="gold-gradient-text">The High Inquest Verdict</span>
        </h2>
        <p className="font-lore" style={{ color: 'var(--text-heading)', marginTop: '0.65rem', maxWidth: '750px', margin: '0.65rem auto 0 auto', lineHeight: 1.7 }}>
          Midnight has passed and dawn encroaches on the battlements. You must now deliver your formal indictment to the Headmistress.
          Designate the culprit responsible for administering Dreamroot to the Archivist and stealing the Veiled Hourglass of Ouroboros.
        </p>
      </div>

      {/* Outcome Verdict Banner */}
      {verdictResult && (
        <div
          className="arcane-panel has-corners"
          style={{
            background: verdictResult.correct ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
            border: `2px solid ${verdictResult.correct ? 'var(--status-emerald)' : 'var(--status-ruby)'}`,
            padding: '2rem',
            textAlign: 'center',
            boxShadow: verdictResult.correct ? '0 0 30px var(--status-emerald-glow)' : '0 0 30px var(--status-ruby-glow)'
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
            {verdictResult.correct ? '🏆' : '⚖️'}
          </div>
          <h3 style={{
            fontSize: '1.6rem',
            color: verdictResult.correct ? '#6ee7b7' : '#fda4af',
            marginBottom: '0.75rem'
          }}>
            {verdictResult.correct ? 'CASE CONCLUDED • GUILT ESTABLISHED' : 'INDICTMENT REJECTED • INSUFFICIENT PROOF'}
          </h3>
          <p className="font-lore" style={{ fontSize: '1.18rem', color: 'var(--text-heading)', lineHeight: 1.75, maxWidth: '720px', margin: '0 auto' }}>
            {verdictResult.message}
          </p>
        </div>
      )}

      {/* Accusation Docket Form */}
      {(!session.verdictSubmitted || !session.verdictCorrect) && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Step 1: Suspect Lineup */}
          <div className="arcane-panel has-corners" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--gold-bright)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>1.</span> Select the Accused
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Review the three primary suspects present in the east wing during the critical window.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              {suspects.map(suspect => {
                const selected = selectedCulprit === suspect.id
                return (
                  <div
                    key={suspect.id}
                    onClick={() => setSelectedCulprit(suspect.id)}
                    className="arcane-panel arcane-panel--interactive"
                    style={{
                      background: selected
                        ? 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(20,24,44,0.95) 100%)'
                        : 'rgba(8, 9, 16, 0.75)',
                      border: `2px solid ${selected ? 'var(--gold-pure)' : 'rgba(212, 175, 55, 0.25)'}`,
                      boxShadow: selected ? 'var(--shadow-gold-hover)' : 'none',
                      padding: '1.25rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span className="badge badge-ruby" style={{ fontSize: '0.62rem' }}>SUSPECT DOSSIER</span>
                      {selected && <span style={{ color: 'var(--gold-bright)', fontSize: '1.1rem' }}>✓</span>}
                    </div>

                    <div style={{ fontFamily: 'var(--font-arcane)', fontSize: '1.2rem', fontWeight: 700, color: selected ? 'var(--gold-bright)' : 'var(--text-heading)' }}>
                      {suspect.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-gold)', marginTop: '0.15rem' }}>
                      {suspect.role}
                    </div>

                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.65rem', lineHeight: 1.4, margin: '0.65rem 0 0 0' }}>
                      {suspect.portrait_description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Step 2: Physical Evidence Checklist */}
          <div className="arcane-panel has-corners" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--gold-bright)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>2.</span> Corroborating Physical Evidence
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Attach recovered clues that substantiate opportunity, alchemical method (Dreamroot), and motive.
            </p>

            {discoveredClues.length === 0 ? (
              <div style={{ color: 'var(--status-amber)', fontStyle: 'italic', padding: '1.5rem 0', textAlign: 'center' }}>
                You have not uncovered any physical clues yet! Return to the chambers and examine residues before filing an accusation.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
                {discoveredClues.map(clue => {
                  const checked = selectedEvidence.includes(clue.id)
                  return (
                    <label
                      key={clue.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        background: checked ? 'rgba(56, 189, 248, 0.15)' : 'rgba(8, 9, 16, 0.7)',
                        border: `1px solid ${checked ? 'var(--magic-cyan)' : 'rgba(255, 255, 255, 0.1)'}`,
                        borderRadius: '6px',
                        padding: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleEvidence(clue.id)}
                        style={{ marginTop: '0.25rem', width: 'auto' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '0.92rem' }}>
                          {clue.title}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.2rem', lineHeight: 1.35 }}>
                          {clue.description.substring(0, 95)}...
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {/* Formal Seal Submission CTA */}
          <button
            type="submit"
            className="btn btn-gold"
            disabled={!selectedCulprit || submitting}
            style={{ padding: '0.9rem 2rem', fontSize: '1.05rem', letterSpacing: '0.08em', justifyContent: 'center' }}
          >
            {submitting ? 'Delivering Indictment to Headmistress...' : '⚖️ Seal and Deliver Final Verdict ➔'}
          </button>
        </form>
      )}
    </div>
  )
}
