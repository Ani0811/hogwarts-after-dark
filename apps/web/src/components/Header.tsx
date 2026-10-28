import React from 'react'
import { CompanionStatus } from '../types/game'

interface HeaderProps {
  currentTab: string
  setTab: (tab: string) => void
  manaPoints: number
  discoveredCluesCount: number
  companionStatus: CompanionStatus
  onRefreshCompanion: () => void
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setTab,
  manaPoints,
  discoveredCluesCount,
  companionStatus,
  onRefreshCompanion
}) => {
  return (
    <header style={{
      background: 'linear-gradient(180deg, #0d0f1c 0%, #080912 100%)',
      borderBottom: '1px solid var(--gold-border)',
      padding: '0.75rem 1.5rem',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow-hud)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.25rem',
        flexWrap: 'wrap'
      }}>
        {/* Crest & Title Branding */}
        <div
          onClick={() => setTab('map')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', cursor: 'pointer', userSelect: 'none' }}
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(212,175,55,0.25) 0%, rgba(10,11,20,0.9) 100%)',
            border: '1px solid var(--gold-pure)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            boxShadow: '0 0 12px rgba(212,175,55,0.3)'
          }}>
            🔮
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{
                fontSize: '1.18rem',
                margin: 0,
                letterSpacing: '0.08em',
                lineHeight: 1.1
              }}>
                <span className="gold-gradient-text">HOGWARTS AFTER DARK</span>
              </h1>
              <span className="badge badge-gold" style={{ fontSize: '0.62rem', padding: '0.1rem 0.4rem' }}>
                FAN INVESTIGATION
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.06em', marginTop: '0.15rem' }}>
              THE VANISHING HOURGLASS • CASE 001
            </div>
          </div>
        </div>

        {/* Primary Navigation Deck */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          background: 'rgba(8, 9, 16, 0.7)',
          padding: '0.3rem 0.4rem',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {[
            { id: 'map', label: 'Investigation', icon: '🗺️' },
            { id: 'evidence', label: 'Evidence Board', icon: '📜', badge: `${discoveredCluesCount}/7` },
            { id: 'archive', label: 'Restricted Section', icon: '📚' },
            { id: 'pensieve', label: 'Pensieve Memories', icon: '🕯️' },
            { id: 'verdict', label: 'The Verdict', icon: '⚖️' },
            { id: 'setup', label: 'Local AI Engine', icon: '⚡' },
          ].map(tab => {
            const active = currentTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`nav-pill ${active ? 'nav-pill--active' : ''}`}
                style={{ fontSize: '0.78rem' }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span style={{
                    fontSize: '0.65rem',
                    background: active ? 'var(--gold-pure)' : 'rgba(255,255,255,0.1)',
                    color: active ? '#0a0b14' : 'var(--text-muted)',
                    padding: '0.1rem 0.35rem',
                    borderRadius: '10px',
                    fontWeight: 700,
                    marginLeft: '0.2rem'
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Right Status Cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Mana Orb Gauge */}
          <div
            title={`Magical Focus: ${manaPoints} / 20 MP available for casting spells`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.2) 0%, rgba(10, 11, 20, 0.8) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              padding: '0.35rem 0.8rem',
              borderRadius: '20px',
              boxShadow: '0 0 10px rgba(56, 189, 248, 0.2)'
            }}
          >
            <span style={{ fontSize: '1rem', filter: 'drop-shadow(0 0 4px var(--magic-cyan))' }}>✨</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--magic-cyan-bright)', letterSpacing: '0.04em' }}>
                {manaPoints} MP
              </span>
              <div style={{
                width: '42px',
                height: '3px',
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min(100, (manaPoints / 20) * 100)}%`,
                  height: '100%',
                  background: 'var(--magic-cyan-bright)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          </div>

          {/* Local AI Engine Status Pill */}
          <div
            onClick={onRefreshCompanion}
            title={
              companionStatus.connected
                ? `Local AI Companion Online • Model: ${companionStatus.aiModel || 'Loaded'} • Click to test`
                : 'Local Companion Offline. Running in 100% In-Browser Demo Mode. Click to test.'
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: companionStatus.connected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              border: `1px solid ${companionStatus.connected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
              padding: '0.35rem 0.85rem',
              borderRadius: '20px',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <span className={`status-dot ${companionStatus.connected ? 'status-dot--online' : 'status-dot--amber'}`} />
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: companionStatus.connected ? '#6ee7b7' : '#fde68a',
              letterSpacing: '0.03em'
            }}>
              {companionStatus.connected
                ? (companionStatus.aiAvailable ? `AI: ${companionStatus.aiModel?.split('/').pop()?.substring(0, 14) || 'Ready'}` : 'AI: Companion Connected')
                : 'Demo Mode (No AI)'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
