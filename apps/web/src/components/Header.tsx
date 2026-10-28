import React from 'react'
import { CompanionStatus } from '../types/game'

interface HeaderProps {
  currentTab: string
  setTab: (tab: string) => void
  manaPoints: number
  companionStatus: CompanionStatus
  onRefreshCompanion: () => void
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setTab,
  manaPoints,
  companionStatus,
  onRefreshCompanion
}) => {
  return (
    <header style={{
      background: 'linear-gradient(180deg, #101026 0%, #0a0a18 100%)',
      borderBottom: '1px solid var(--color-border)',
      padding: '0.75rem 1.5rem',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 4px 20px rgba(0,0,0,0.6)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        {/* Logo and Subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => setTab('map')}>
          <div style={{
            fontSize: '1.75rem',
            filter: 'drop-shadow(0 0 8px rgba(201,168,76,0.5))'
          }}>
            🔮
          </div>
          <div>
            <h1 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              margin: 0,
              color: 'var(--color-gold-bright)',
              fontFamily: 'var(--font-heading)'
            }}>
              HOGWARTS AFTER DARK
            </h1>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              The Vanishing Hourglass • Case 001
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {[
            { id: 'map', label: 'Castle Map', icon: '🗺️' },
            { id: 'evidence', label: 'Evidence Board', icon: '📜' },
            { id: 'archive', label: 'Restricted Section', icon: '📚' },
            { id: 'pensieve', label: 'Pensieve Memories', icon: '🕯️' },
            { id: 'verdict', label: 'Verdict', icon: '⚖️' },
            { id: 'setup', label: 'Local AI & Setup', icon: '⚡' },
          ].map(tab => {
            const active = currentTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className="btn"
                style={{
                  background: active ? 'rgba(201,168,76,0.18)' : 'transparent',
                  borderColor: active ? 'var(--color-gold)' : 'transparent',
                  color: active ? 'var(--color-gold-bright)' : 'var(--color-text-secondary)',
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.85rem',
                  borderRadius: '4px'
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Status Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Mana Counter */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(74, 127, 203, 0.15)',
            border: '1px solid rgba(74, 127, 203, 0.4)',
            padding: '0.35rem 0.75rem',
            borderRadius: '20px',
            fontSize: '0.85rem',
            color: 'var(--color-magic-bright)',
            fontWeight: 600
          }}>
            <span>✨</span>
            <span>{manaPoints} MP</span>
          </div>

          {/* AI Companion Connection Pill */}
          <div
            onClick={onRefreshCompanion}
            title={companionStatus.connected ? `Companion Connected (${companionStatus.aiModel || 'No Model Loaded'})` : 'Companion Disconnected (Running In Standalone Demo Mode). Click to retry.'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: companionStatus.connected ? 'rgba(64, 160, 96, 0.15)' : 'rgba(201, 128, 64, 0.15)',
              border: `1px solid ${companionStatus.connected ? 'var(--color-success)' : 'var(--color-warning)'}`,
              padding: '0.35rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <span className={`status-dot ${companionStatus.connected ? 'status-dot--online' : 'status-dot--unknown'}`} />
            <span style={{ color: companionStatus.connected ? '#7fe0a0' : '#f0c080' }}>
              {companionStatus.connected
                ? (companionStatus.aiAvailable ? `Local AI: ${companionStatus.aiModel?.split('/').pop() || 'Ready'}` : 'Companion: Active (AI Idle)')
                : 'Demo Mode (No AI)'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

