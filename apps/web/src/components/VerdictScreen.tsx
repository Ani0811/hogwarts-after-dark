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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <div className="card" style={{ borderLeft: '4px solid var(--color-gold)', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.85rem', color: 'var(--color-gold-bright)', margin: 0 }}>
          The Final Verdict of the Academy
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem', lineHeight: 1.6 }}>
          Dawn approaches over the castle spires. You must present your official findings to the Headmistress.
          Designate the culprit responsible for drugging the Archivist and taking the Veiled Hourglass, and present the physical evidence supporting your deduction.
        </p>
      </div>

      {/* Outcome Banner (if submitted) */}
      {verdictResult && (
        <div
          className="card"
          style={{
            background: verdictResult.correct ? 'rgba(64, 160, 96, 0.15)' : 'rgba(192, 64, 64, 0.15)',
            border: `2px solid ${verdictResult.correct ? 'var(--color-success)' : 'var(--color-danger)'}`,
            padding: '1.5rem',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
            {verdictResult.correct ? '🏆' : '⚖️'}
          </div>
          <h3 style={{
            fontSize: '1.4rem',
            color: verdictResult.correct ? 'var(--color-success)' : 'var(--color-danger)',
            marginBottom: '0.75rem'
          }}>
            {verdictResult.correct ? 'CASE SOLVED' : 'VERDICT REJECTED'}
          </h3>
          <p style={{ fontSize: '1rem', color: 'var(--color-text-primary)', lineHeight: 1.6, maxWidth: '650px', margin: '0 auto' }}>
            {verdictResult.message}
          </p>
        </div>
      )}

      {/* Accusation Form */}
      {(!session.verdictSubmitted || !session.verdictCorrect) && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* 1. Select Suspect */}
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-gold)', marginBottom: '1rem' }}>
              1. Name the Culprit
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {suspects.map(suspect => {
                const selected = selectedCulprit === suspect.id
                return (
                  <div
                    key={suspect.id}
                    onClick={() => setSelectedCulprit(suspect.id)}
                    style={{
                      background: selected ? 'rgba(201, 168, 76, 0.15)' : 'rgba(10, 10, 24, 0.6)',
                      border: `2px solid ${selected ? 'var(--color-gold)' : 'rgba(201, 168, 76, 0.2)'}`,
                      borderRadius: '8px',
                      padding: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: selected ? '0 0 12px rgba(201,168,76,0.3)' : 'none'
                    }}
                  >
                    <div style={{ fontWeight: 700, color: selected ? 'var(--color-gold-bright)' : 'var(--color-text-primary)', fontSize: '1.05rem' }}>
                      {suspect.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                      {suspect.role}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', marginBottom: 0 }}>
                      {suspect.portrait_description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 2. Corroborating Evidence */}
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-gold)', marginBottom: '0.5rem' }}>
              2. Attach Supporting Physical Evidence
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
              Select the clues from your investigation that directly establish means, motive, and opportunity.
            </p>

            {discoveredClues.length === 0 ? (
              <div style={{ color: 'var(--color-warning)', fontStyle: 'italic', padding: '1rem 0' }}>
                You have not discovered any clues yet! Explore the castle and examine traces before presenting a verdict.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {discoveredClues.map(clue => {
                  const checked = selectedEvidence.includes(clue.id)
                  return (
                    <label
                      key={clue.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        background: checked ? 'rgba(74, 127, 203, 0.15)' : 'rgba(10, 10, 24, 0.5)',
                        border: `1px solid ${checked ? 'var(--color-magic)' : 'rgba(255, 255, 255, 0.1)'}`,
                        borderRadius: '6px',
                        padding: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleEvidence(clue.id)}
                        style={{ marginTop: '0.2rem', width: 'auto' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-heading)', fontSize: '0.9rem' }}>
                          {clue.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                          {clue.description.substring(0, 90)}...
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!selectedCulprit || submitting}
            style={{ padding: '0.85rem 1.5rem', fontSize: '1.05rem', letterSpacing: '0.08em' }}
          >
            {submitting ? 'Delivering Verdict...' : '⚖️ Submit Formal Accusation'}
          </button>
        </form>
      )}
    </div>
  )
}
