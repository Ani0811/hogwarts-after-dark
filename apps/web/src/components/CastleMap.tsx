import React from 'react'
import { InvestigationSession } from '../types/game'
import { LOCATIONS, CHARACTERS } from '../services/caseData'

interface CastleMapProps {
  session: InvestigationSession
  onMoveTo: (locationId: string) => void
}

export const CastleMap: React.FC<CastleMapProps> = ({ session, onMoveTo }) => {
  const currentLoc = LOCATIONS[session.currentLocationId]

  const layout: Record<string, { x: number; y: number; label: string; icon: string; code: string }> = {
    loc_entrance_hall: { x: 50, y: 55, label: 'Entrance Hall', icon: '🏰', code: 'MAIN FOYER' },
    loc_archivist_study: { x: 18, y: 50, label: "Archivist's Study", icon: '📖', code: 'WEST STUDY' },
    loc_east_corridor: { x: 74, y: 50, label: 'East Corridor', icon: '🏛️', code: 'EAST WING' },
    loc_herbarium: { x: 82, y: 82, label: 'The Herbarium', icon: '🌿', code: 'GREENHOUSE' },
    loc_bell_tower: { x: 82, y: 18, label: 'Bell Tower', icon: '🔔', code: 'NORTH TOWER' },
  }

  return (
    <div className="arcane-panel has-corners" style={{ padding: '1.5rem', background: '#080912' }}>
      {/* Map Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.3rem' }}>📜</span>
            <h3 style={{ fontSize: '1.3rem', margin: 0 }}>
              <span className="gold-gradient-text">The Marauder's Nocturnal Chart</span>
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
            Live spatial representation of the Academy of Veiled Arts. Select any connected corridor to traverse.
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span className="status-dot status-dot--online" />
            <span>Investigator Position</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ color: 'var(--magic-cyan-bright)' }}>➔</span>
            <span>Passable Route</span>
          </div>
        </div>
      </div>

      {/* Parchment Chart Viewport */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '460px',
        background: 'radial-gradient(ellipse at center, #101226 0%, #06070e 100%)',
        border: '1px solid var(--gold-border)',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)'
      }}>
        {/* Architectural Grid & Runes */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(212,175,55,0.12) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.7,
          pointerEvents: 'none'
        }} />

        {/* Corridor Connection SVG */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {/* Study <-> Entrance Hall */}
          <line x1="22%" y1="50%" x2="48%" y2="55%" stroke="rgba(212,175,55,0.4)" strokeWidth="2.5" strokeDasharray="6 5" />
          {/* Entrance Hall <-> East Corridor */}
          <line x1="52%" y1="55%" x2="74%" y2="50%" stroke="rgba(212,175,55,0.4)" strokeWidth="2.5" strokeDasharray="6 5" />
          {/* East Corridor <-> Herbarium */}
          <line x1="74%" y1="50%" x2="82%" y2="80%" stroke="rgba(212,175,55,0.4)" strokeWidth="2.5" strokeDasharray="6 5" />
          {/* East Corridor <-> Bell Tower */}
          <line x1="74%" y1="50%" x2="82%" y2="20%" stroke="rgba(212,175,55,0.4)" strokeWidth="2.5" strokeDasharray="6 5" />
        </svg>

        {/* Chamber Nodes */}
        {Object.entries(layout).map(([locId, pos]) => {
          const loc = LOCATIONS[locId]
          const isCurrent = session.currentLocationId === locId
          const isConnected = currentLoc?.connected_locations.includes(locId)
          const charactersHere = Object.values(CHARACTERS).filter(c => c.location_id === locId)

          return (
            <div
              key={locId}
              onClick={() => {
                if (isConnected && !isCurrent) onMoveTo(locId)
              }}
              style={{
                position: 'absolute',
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
                width: '185px',
                padding: '0.85rem',
                borderRadius: '8px',
                background: isCurrent
                  ? 'linear-gradient(135deg, rgba(212,175,55,0.25) 0%, rgba(12,14,28,0.96) 100%)'
                  : isConnected
                  ? 'linear-gradient(135deg, rgba(20,24,48,0.92) 0%, rgba(10,11,22,0.92) 100%)'
                  : 'rgba(10, 11, 20, 0.75)',
                border: `2px solid ${
                  isCurrent
                    ? 'var(--gold-pure)'
                    : isConnected
                    ? 'rgba(212, 175, 55, 0.55)'
                    : 'rgba(255, 255, 255, 0.1)'
                }`,
                boxShadow: isCurrent
                  ? '0 0 20px rgba(212, 175, 55, 0.4), inset 0 0 10px rgba(212, 175, 55, 0.15)'
                  : isConnected
                  ? '0 4px 16px rgba(0,0,0,0.6)'
                  : 'none',
                cursor: isConnected && !isCurrent ? 'pointer' : isCurrent ? 'default' : 'not-allowed',
                transition: 'all 0.25s ease',
                zIndex: isCurrent ? 20 : 10
              }}
            >
              {/* Header inside node */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '1.2rem' }}>{pos.icon}</span>
                <span style={{ fontSize: '0.62rem', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                  {pos.code}
                </span>
              </div>

              <div style={{
                fontFamily: 'var(--font-arcane)',
                fontSize: '0.88rem',
                fontWeight: 700,
                color: isCurrent ? 'var(--gold-bright)' : isConnected ? 'var(--text-heading)' : 'var(--text-muted)',
                lineHeight: 1.2
              }}>
                {loc?.name}
              </div>

              {/* Player Footprint or Route CTA */}
              {isCurrent ? (
                <div style={{
                  marginTop: '0.45rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  color: 'var(--gold-bright)',
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}>
                  <span>👣</span> <em>Investigator Present</em>
                </div>
              ) : isConnected ? (
                <div style={{
                  marginTop: '0.45rem',
                  color: 'var(--magic-cyan-bright)',
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}>
                  ➔ Travel to Chamber
                </div>
              ) : null}

              {/* Characters Present in Room */}
              {charactersHere.length > 0 && (
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {charactersHere.map(c => (
                    <span
                      key={c.id}
                      style={{
                        background: 'rgba(244, 63, 94, 0.15)',
                        border: '1px solid rgba(244, 63, 94, 0.35)',
                        color: '#fda4af',
                        fontSize: '0.68rem',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '3px',
                        display: 'inline-block'
                      }}
                    >
                      👤 {c.name.split(' ')[0]} ({c.role.split(' ')[0]})
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
