import React from 'react'
import { InvestigationSession } from '../types/game'
import { LOCATIONS, CHARACTERS, CLUES, SPELLS } from '../services/caseData'

interface LocationViewProps {
  session: InvestigationSession
  onInspectClue: (clueId: string) => void
  onInterview: (characterId: string) => void
  onCastSpell: (spellId: string) => void
  onMoveTo: (locationId: string) => void
}

export const LocationView: React.FC<LocationViewProps> = ({
  session,
  onInspectClue,
  onInterview,
  onCastSpell,
  onMoveTo
}) => {
  const currentLoc = LOCATIONS[session.currentLocationId]

  if (!currentLoc) {
    return <div className="card">Location not found.</div>
  }

  // Find suspects currently in this location
  const suspectsHere = Object.values(CHARACTERS).filter(c => c.location_id === currentLoc.id)

  // Find clues in this location
  const roomClues = currentLoc.available_clue_ids.map(cid => CLUES[cid]).filter(Boolean)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Chamber Header & Narrative */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(20,20,40,0.95) 0%, rgba(13,13,26,0.95) 100%)',
        borderLeft: '4px solid var(--color-gold)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', color: 'var(--color-gold-bright)', margin: 0 }}>
              {currentLoc.name}
            </h2>
            <div style={{ fontStyle: 'italic', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
              "{currentLoc.atmosphere}"
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {currentLoc.connected_locations.map(connId => {
              const target = LOCATIONS[connId]
              return (
                <button
                  key={connId}
                  onClick={() => onMoveTo(connId)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                >
                  Exit to {target?.name} ➔
                </button>
              )
            })}
          </div>
        </div>

        <p style={{ marginTop: '1rem', color: 'var(--color-text-primary)', lineHeight: 1.7 }}>
          {currentLoc.description}
        </p>

        {/* Quick Investigative Spell Bar */}
        <div style={{
          marginTop: '1.25rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gold)' }}>
            Investigative Wandwork:
          </span>
          {Object.values(SPELLS).map(spell => {
            const hasMana = session.manaPoints >= spell.cost
            return (
              <button
                key={spell.id}
                onClick={() => onCastSpell(spell.id)}
                disabled={!hasMana}
                className="btn btn-magic"
                style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
                title={`${spell.description} (${spell.cost} MP)`}
              >
                <span>🪄 {spell.incantation}</span>
                <span style={{ opacity: 0.8, fontSize: '0.75rem' }}>({spell.cost} MP)</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid: Suspects Present & Clues Available */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Suspects in Chamber */}
        <div className="card">
          <h3 style={{ fontSize: '1.2rem', color: 'var(--color-gold)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>👥</span> Persons Present ({suspectsHere.length})
          </h3>
          {suspectsHere.length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '1rem 0' }}>
              No one else is in this room. The shadows are quiet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {suspectsHere.map(suspect => (
                <div
                  key={suspect.id}
                  style={{
                    background: 'rgba(10, 10, 24, 0.6)',
                    border: '1px solid rgba(201,168,76,0.2)',
                    borderRadius: '6px',
                    padding: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: 0, color: 'var(--color-text-heading)', fontSize: '1.05rem' }}>
                        {suspect.name}
                      </h4>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-gold)' }}>
                        {suspect.role}
                      </div>
                    </div>
                    <button
                      onClick={() => onInterview(suspect.id)}
                      className="btn btn-primary"
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                    >
                      Question Suspect 💬
                    </button>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0.5rem 0 0 0' }}>
                    {suspect.appearance}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clues & Environmental Evidence */}
        <div className="card">
          <h3 style={{ fontSize: '1.2rem', color: 'var(--color-gold)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🔍</span> Environmental Clues ({roomClues.length})
          </h3>
          {roomClues.length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '1rem 0' }}>
              No physical clues evident on the surface.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {roomClues.map(clue => {
                const isDiscovered = session.discoveredClueIds.includes(clue.id)
                const requiresSpell = clue.requires_spell

                return (
                  <div
                    key={clue.id}
                    style={{
                      background: isDiscovered
                        ? 'rgba(64, 160, 96, 0.08)'
                        : 'rgba(10, 10, 24, 0.6)',
                      border: `1px solid ${
                        isDiscovered
                          ? 'rgba(64, 160, 96, 0.35)'
                          : 'rgba(201, 168, 76, 0.2)'
                      }`,
                      borderRadius: '6px',
                      padding: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.1rem' }}>{isDiscovered ? '📜' : '✨'}</span>
                          <span style={{
                            fontWeight: 600,
                            color: isDiscovered ? 'var(--color-gold-bright)' : 'var(--color-text-secondary)',
                            fontSize: '0.95rem'
                          }}>
                            {isDiscovered ? clue.title : 'Concealed Magical Trace'}
                          </span>
                        </div>
                        {!isDiscovered && requiresSpell && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-warning)', marginTop: '0.2rem' }}>
                            Protected by concealment • Requires: <strong>{SPELLS[requiresSpell]?.name || 'a spell'}</strong>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => onInspectClue(clue.id)}
                        className={`btn ${isDiscovered ? 'btn-secondary' : 'btn-primary'}`}
                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                      >
                        {isDiscovered ? 'Inspect Details' : 'Scrutinize'}
                      </button>
                    </div>

                    {isDiscovered && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', marginTop: '0.5rem', marginBottom: 0 }}>
                        {clue.description}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
