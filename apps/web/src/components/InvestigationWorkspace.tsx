import React, { useState } from 'react'
import { InvestigationSession } from '../types/game'
import { LOCATIONS, CHARACTERS, CLUES, SPELLS } from '../services/caseData'
import { CastleMap } from './CastleMap'

interface InvestigationWorkspaceProps {
  session: InvestigationSession
  onMoveTo: (locationId: string) => void
  onInspectClue: (clueId: string) => void
  onInterview: (characterId: string) => void
  onCastSpell: (spellId: string) => void
}

export const InvestigationWorkspace: React.FC<InvestigationWorkspaceProps> = ({
  session,
  onMoveTo,
  onInspectClue,
  onInterview,
  onCastSpell
}) => {
  const [viewMode, setViewMode] = useState<'chamber' | 'map'>('chamber')
  const currentLoc = LOCATIONS[session.currentLocationId]

  if (!currentLoc) {
    return <div className="arcane-panel">Chamber not found.</div>
  }

  const suspectsHere = Object.values(CHARACTERS).filter(c => c.location_id === currentLoc.id)
  const roomClues = currentLoc.available_clue_ids.map(cid => CLUES[cid]).filter(Boolean)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Chamber Header & View Mode Switcher */}
      <div className="arcane-panel arcane-panel--glass has-corners" style={{
        padding: '1.25rem 1.75rem',
        borderLeft: '4px solid var(--gold-pure)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.4rem' }}>
              {currentLoc.id === 'loc_entrance_hall' ? '🏰' :
               currentLoc.id === 'loc_archivist_study' ? '📖' :
               currentLoc.id === 'loc_herbarium' ? '🌿' :
               currentLoc.id === 'loc_bell_tower' ? '🔔' : '🏛️'}
            </span>
            <h2 style={{ fontSize: '1.6rem', margin: 0 }}>
              <span className="gold-gradient-text">{currentLoc.name}</span>
            </h2>
            <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>
              CURRENT LOCATION
            </span>
          </div>
          <div className="font-lore" style={{ color: 'var(--text-gold)', fontStyle: 'italic', marginTop: '0.35rem' }}>
            "{currentLoc.atmosphere}"
          </div>
        </div>

        {/* View Switcher Toggle */}
        <div style={{
          display: 'flex',
          background: 'rgba(8, 9, 16, 0.8)',
          padding: '0.3rem',
          borderRadius: '8px',
          border: '1px solid var(--gold-border)'
        }}>
          <button
            onClick={() => setViewMode('chamber')}
            className={`btn ${viewMode === 'chamber' ? 'btn-gold' : 'btn-stealth'}`}
            style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
          >
            <span>🏰 Chamber Inspection</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`btn ${viewMode === 'map' ? 'btn-gold' : 'btn-stealth'}`}
            style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
          >
            <span>🗺️ Marauder's Map</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Tactical Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 340px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Navigator & Detective Field Kit */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Spatial Chamber Navigator */}
          <div className="arcane-panel has-corners">
            <h3 style={{ fontSize: '0.95rem', color: 'var(--gold-bright)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>🧭 Chamber Navigation</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CONNECTED CORRIDORS</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.values(LOCATIONS).map(loc => {
                const isCurrent = loc.id === currentLoc.id
                const isConnected = currentLoc.connected_locations.includes(loc.id)

                return (
                  <div
                    key={loc.id}
                    onClick={() => {
                      if (isConnected && !isCurrent) onMoveTo(loc.id)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '6px',
                      background: isCurrent
                        ? 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(20,24,44,0.7) 100%)'
                        : isConnected
                        ? 'rgba(255, 255, 255, 0.03)'
                        : 'transparent',
                      border: `1px solid ${
                        isCurrent
                          ? 'var(--gold-pure)'
                          : isConnected
                          ? 'rgba(212, 175, 55, 0.3)'
                          : 'rgba(255, 255, 255, 0.06)'
                      }`,
                      cursor: isConnected && !isCurrent ? 'pointer' : 'default',
                      opacity: isCurrent || isConnected ? 1 : 0.45,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1rem' }}>
                        {isCurrent ? '👣' : isConnected ? '🚪' : '🔒'}
                      </span>
                      <span style={{
                        fontSize: '0.85rem',
                        fontWeight: isCurrent ? 700 : 500,
                        color: isCurrent ? 'var(--gold-bright)' : isConnected ? 'var(--text-heading)' : 'var(--text-muted)'
                      }}>
                        {loc.name}
                      </span>
                    </div>

                    {isCurrent ? (
                      <span className="badge badge-gold" style={{ fontSize: '0.62rem' }}>YOU ARE HERE</span>
                    ) : isConnected ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--magic-cyan-bright)', fontWeight: 600 }}>
                        ENTER ➔
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>SEALED</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Suspects in Chamber Docket */}
          <div className="arcane-panel has-corners">
            <h3 style={{ fontSize: '0.95rem', color: 'var(--gold-bright)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>👥 Persons Present</span>
              <span className="badge badge-charcoal" style={{ fontSize: '0.68rem' }}>
                {suspectsHere.length} PRESENT
              </span>
            </h3>

            {suspectsHere.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                No students or staff are in this room. The shadows remain undisturbed.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {suspectsHere.map(suspect => (
                  <div
                    key={suspect.id}
                    style={{
                      background: 'rgba(8, 9, 16, 0.8)',
                      border: '1px solid rgba(212,175,55,0.3)',
                      borderRadius: '6px',
                      padding: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '0.95rem' }}>
                          {suspect.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-gold)', marginTop: '0.1rem' }}>
                          {suspect.role}
                        </div>
                      </div>
                      <span className="badge badge-ruby" style={{ fontSize: '0.65rem' }}>
                        SUSPECT
                      </span>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.4rem 0 0.6rem 0', lineHeight: 1.4 }}>
                      {suspect.portrait_description}
                    </p>

                    <button
                      onClick={() => onInterview(suspect.id)}
                      className="btn btn-gold"
                      style={{ width: '100%', fontSize: '0.78rem', padding: '0.45rem' }}
                    >
                      <span>💬 Interrogate Suspect</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Wandwork / Charms Bar */}
          <div className="arcane-panel has-corners">
            <h3 style={{ fontSize: '0.95rem', color: 'var(--gold-bright)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>🪄 Prepared Charms</span>
              <span className="badge badge-magic" style={{ fontSize: '0.68rem' }}>
                {session.manaPoints} MP LEFT
              </span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {Object.values(SPELLS).map(spell => {
                const hasMana = session.manaPoints >= spell.cost

                return (
                  <button
                    key={spell.id}
                    onClick={() => onCastSpell(spell.id)}
                    disabled={!hasMana}
                    className="btn btn-magic"
                    style={{
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.8rem'
                    }}
                    title={`${spell.description} (Costs ${spell.cost} MP)`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>✨</span>
                      <strong>{spell.incantation}</strong>
                    </div>
                    <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>
                      {spell.cost} MP
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </aside>

        {/* Right Column: Stage (Chamber Inspection or Marauder's Map) */}
        <main style={{ minWidth: 0 }}>
          {viewMode === 'map' ? (
            <CastleMap session={session} onMoveTo={onMoveTo} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Detailed Chamber Narrative */}
              <div className="arcane-panel arcane-panel--glass has-corners" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--gold-bright)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📜</span> Chamber Inspection Log
                </h3>
                <p className="font-lore" style={{ color: 'var(--text-heading)', fontSize: '1.15rem', lineHeight: 1.75, margin: 0 }}>
                  {currentLoc.description}
                </p>
              </div>

              {/* Environmental Clues Grid */}
              <div className="arcane-panel has-corners" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', color: 'var(--gold-bright)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>🔍</span> Environmental Evidence in this Room ({roomClues.length})
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                      Search for objects, traces of poison, or concealed alchemical residues.
                    </p>
                  </div>
                </div>

                {roomClues.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1.5rem 0', textAlign: 'center' }}>
                    No physical evidence is visible in this chamber. Try moving to another room or casting revelation spells.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    {roomClues.map(clue => {
                      const isDiscovered = session.discoveredClueIds.includes(clue.id)
                      const reqSpell = clue.requires_spell ? SPELLS[clue.requires_spell] : null

                      return (
                        <div
                          key={clue.id}
                          className="arcane-panel"
                          style={{
                            background: isDiscovered ? 'rgba(16, 20, 36, 0.95)' : 'rgba(10, 11, 20, 0.7)',
                            borderColor: isDiscovered ? 'rgba(212, 175, 55, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            padding: '1rem'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '1.1rem' }}>{isDiscovered ? '📜' : '✨'}</span>
                              <span className={`badge ${isDiscovered ? 'badge-emerald' : 'badge-gold'}`} style={{ fontSize: '0.65rem' }}>
                                {isDiscovered ? '✓ DISCOVERED' : '🔒 CONCEALED'}
                              </span>
                            </div>

                            <h4 style={{
                              fontSize: '1.05rem',
                              color: isDiscovered ? 'var(--gold-bright)' : 'var(--text-muted)',
                              marginBottom: '0.45rem'
                            }}>
                              {isDiscovered ? clue.title : 'Unidentified Magical Trace'}
                            </h4>

                            <p style={{
                              fontSize: '0.88rem',
                              color: isDiscovered ? 'var(--text-body)' : 'var(--text-muted)',
                              lineHeight: 1.5,
                              margin: 0
                            }}>
                              {isDiscovered
                                ? clue.description
                                : reqSpell
                                ? `Hidden beneath a magical ward. Requires casting ${reqSpell.name} (${reqSpell.incantation}).`
                                : 'A subtle physical trace waiting to be scrutinized.'}
                            </p>
                          </div>

                          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <button
                              onClick={() => onInspectClue(clue.id)}
                              className={`btn ${isDiscovered ? 'btn-stealth' : 'btn-gold'}`}
                              style={{ width: '100%', fontSize: '0.8rem', padding: '0.45rem' }}
                            >
                              {isDiscovered ? 'Re-Examine Details ➔' : 'Scrutinize Trace ➔'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
