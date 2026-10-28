import React from 'react'
import { InvestigationSession } from '../types/game'
import { LOCATIONS, CHARACTERS } from '../services/caseData'

interface CastleMapProps {
  session: InvestigationSession
  onMoveTo: (locationId: string) => void
}

export const CastleMap: React.FC<CastleMapProps> = ({ session, onMoveTo }) => {
  const currentLoc = LOCATIONS[session.currentLocationId]

  // Spatial layout coordinates for visual positioning
  const layout: Record<string, { x: number; y: number; label: string; icon: string }> = {
    loc_entrance_hall: { x: 45, y: 55, label: 'Entrance Hall', icon: '🏰' },
    loc_archivist_study: { x: 18, y: 50, label: "Archivist's Study", icon: '📖' },
    loc_east_corridor: { x: 72, y: 50, label: 'East Corridor', icon: '🏛️' },
    loc_herbarium: { x: 80, y: 80, label: 'The Herbarium', icon: '🌿' },
    loc_bell_tower: { x: 80, y: 18, label: 'Bell Tower', icon: '🔔' },
  }

  return (
    <div className="card" style={{
      background: 'radial-gradient(ellipse at center, #181832 0%, #0d0d1e 100%)',
      border: '1px solid var(--color-border)',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--color-gold)', margin: 0 }}>
            Marauder's Map — Academy of Veiled Arts
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: '0.25rem 0 0 0' }}>
            Click on any connected chamber to stealthily navigate the nocturnal corridors.
          </p>
        </div>
        <div style={{
          background: 'rgba(201, 168, 76, 0.1)',
          border: '1px solid var(--color-gold-dim)',
          padding: '0.4rem 0.8rem',
          borderRadius: '4px',
          fontSize: '0.85rem',
          color: 'var(--color-gold-bright)'
        }}>
          Currently in: <strong>{currentLoc?.name || 'Unknown'}</strong>
        </div>
      </div>

      {/* SVG Map Canvas */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '420px',
        backgroundColor: '#0a0a16',
        backgroundImage: 'radial-gradient(circle, rgba(201,168,76,0.08) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        border: '1px solid rgba(201, 168, 76, 0.2)',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {/* Connection corridors */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {/* Study <-> Hall */}
          <line x1="22%" y1="52%" x2="48%" y2="57%" stroke="rgba(201, 168, 76, 0.35)" strokeWidth="3" strokeDasharray="6 4" />
          {/* Hall <-> East Corridor */}
          <line x1="48%" y1="57%" x2="72%" y2="52%" stroke="rgba(201, 168, 76, 0.35)" strokeWidth="3" strokeDasharray="6 4" />
          {/* East Corridor <-> Herbarium */}
          <line x1="72%" y1="52%" x2="80%" y2="78%" stroke="rgba(201, 168, 76, 0.35)" strokeWidth="3" strokeDasharray="6 4" />
          {/* East Corridor <-> Bell Tower */}
          <line x1="72%" y1="52%" x2="80%" y2="24%" stroke="rgba(201, 168, 76, 0.35)" strokeWidth="3" strokeDasharray="6 4" />
        </svg>

        {/* Room Nodes */}
        {Object.entries(layout).map(([locId, pos]) => {
          const loc = LOCATIONS[locId]
          const isCurrent = session.currentLocationId === locId
          const isConnected = currentLoc?.connected_locations.includes(locId)

          // Characters in this room
          const charactersHere = Object.values(CHARACTERS).filter(c => c.location_id === locId)

          return (
            <div
              key={locId}
              onClick={() => {
                if (isConnected && !isCurrent) {
                  onMoveTo(locId)
                }
              }}
              style={{
                position: 'absolute',
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
                width: '170px',
                padding: '0.75rem',
                borderRadius: '8px',
                background: isCurrent
                  ? 'linear-gradient(135deg, rgba(201,168,76,0.25) 0%, rgba(20,20,40,0.95) 100%)'
                  : isConnected
                  ? 'rgba(25, 25, 50, 0.9)'
                  : 'rgba(15, 15, 30, 0.7)',
                border: `2px solid ${
                  isCurrent
                    ? 'var(--color-gold)'
                    : isConnected
                    ? 'rgba(201, 168, 76, 0.5)'
                    : 'rgba(255, 255, 255, 0.1)'
                }`,
                boxShadow: isCurrent ? '0 0 16px rgba(201, 168, 76, 0.4)' : '0 4px 12px rgba(0,0,0,0.5)',
                cursor: isConnected && !isCurrent ? 'pointer' : isCurrent ? 'default' : 'not-allowed',
                transition: 'all 0.2s ease',
                zIndex: isCurrent ? 10 : 5
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '1.25rem' }}>{pos.icon}</span>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: isCurrent ? 'var(--color-gold-bright)' : 'var(--color-text-primary)'
                }}>
                  {loc?.name}
                </span>
              </div>

              {/* Status / Footsteps indicator */}
              {isCurrent && (
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  marginTop: '0.25rem'
                }}>
                  <span>👣</span>
                  <em>You are here</em>
                </div>
              )}

              {/* Connected Travel Button */}
              {isConnected && !isCurrent && (
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-magic-bright)',
                  marginTop: '0.25rem',
                  fontWeight: 600
                }}>
                  ➔ Click to Enter
                </div>
              )}

              {/* Suspect presence tags */}
              {charactersHere.length > 0 && (
                <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {charactersHere.map(c => (
                    <span
                      key={c.id}
                      style={{
                        background: 'rgba(74, 127, 203, 0.2)',
                        border: '1px solid rgba(74, 127, 203, 0.4)',
                        color: 'var(--color-magic-bright)',
                        fontSize: '0.7rem',
                        padding: '0.1rem 0.35rem',
                        borderRadius: '3px',
                        display: 'inline-block'
                      }}
                    >
                      👤 {c.name.split(' ')[0]}
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
