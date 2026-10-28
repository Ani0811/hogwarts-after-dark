import React, { useState } from 'react'
import { LORE } from '../services/caseData'

export const RestrictedSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = ['all', ...Array.from(new Set(LORE.map(l => l.category)))]

  const filteredLore = LORE.filter(entry => {
    const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory
    const q = searchQuery.toLowerCase().trim()
    const matchesQuery = !q ||
      entry.title.toLowerCase().includes(q) ||
      entry.content.toLowerCase().includes(q) ||
      entry.tags.some(t => t.toLowerCase().includes(q))
    return matchesCategory && matchesQuery
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Grimoire Shelf Header */}
      <div className="arcane-panel arcane-panel--glass has-corners" style={{
        padding: '1.5rem 1.75rem',
        borderLeft: '4px solid var(--magic-cyan)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '1.4rem' }}>📚</span>
          <h2 style={{ fontSize: '1.6rem', margin: 0 }}>
            <span className="gold-gradient-text">The Restricted Section Archives</span>
          </h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.35rem', marginBottom: '1.25rem' }}>
          Consult ancient grimoires, chronomancy treatises, and rare poison compendiums to cross-reference evidence discovered in the castle.
        </p>

        {/* Search & Category Shelf */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search ancient lore (e.g. Dreamroot, Ouroboros Hourglass, Steadfast Wax, Chronomancy)..."
              style={{ paddingLeft: '2.5rem' }}
            />
            <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
              🔍
            </span>
          </div>

          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="btn btn-stealth">
              Clear Filter
            </button>
          )}
        </div>

        {/* Category Book Spines */}
        <div style={{ display: 'flex', gap: '0.45rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`nav-pill ${selectedCategory === cat ? 'nav-pill--active' : ''}`}
              style={{ fontSize: '0.76rem', padding: '0.35rem 0.75rem' }}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Parchment Treatise Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
        {filteredLore.length === 0 ? (
          <div className="arcane-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
            No parchment or restricted folio matches your query in the Academy catalogue.
          </div>
        ) : (
          filteredLore.map(entry => (
            <div
              key={entry.id}
              className="arcane-panel has-corners"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: 'rgba(16, 18, 32, 0.96)',
                border: '1px solid rgba(212, 175, 55, 0.35)',
                padding: '1.5rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: 'var(--text-gold)',
                    textTransform: 'uppercase'
                  }}>
                    {entry.category}
                  </span>
                  {entry.case_relevant && (
                    <span className="badge badge-magic" style={{ fontSize: '0.65rem' }}>
                      ⚡ CASE CRITICAL
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.25rem', color: 'var(--gold-bright)', marginBottom: '0.85rem' }}>
                  {entry.title}
                </h3>

                <p className="font-lore" style={{ fontSize: '1.08rem', color: 'var(--text-heading)', lineHeight: 1.7, margin: 0 }}>
                  {entry.content}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {entry.tags.map(t => (
                  <span
                    key={t}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      fontSize: '0.7rem',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '3px',
                      color: 'var(--text-muted)'
                    }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
