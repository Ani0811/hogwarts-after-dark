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
      <div className="card" style={{ borderLeft: '4px solid var(--color-magic)' }}>
        <h2 style={{ fontSize: '1.75rem', color: 'var(--color-gold)', margin: 0 }}>
          The Restricted Section Archives
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem', marginBottom: '1rem' }}>
          Consult ancient grimoires, poison compendiums, and chronomancy research to correlate evidence discovered in the castle.
        </p>

        {/* Search Bar */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search keywords (e.g. Dreamroot, Hourglass, Steadfast Wax, temporal)..."
            style={{ flex: 1, minWidth: '240px' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="btn btn-secondary">
              Clear Search
            </button>
          )}
        </div>

        {/* Categories */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="btn btn-secondary"
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.6rem',
                background: selectedCategory === cat ? 'rgba(201,168,76,0.2)' : 'transparent',
                borderColor: selectedCategory === cat ? 'var(--color-gold)' : 'var(--color-border)'
              }}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Lore Entries */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {filteredLore.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            No parchment or treatise matches your query in the restricted catalogue.
          </div>
        ) : (
          filteredLore.map(entry => (
            <div
              key={entry.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: 'rgba(16, 16, 32, 0.95)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    color: 'var(--color-gold)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {entry.category}
                  </span>
                  {entry.case_relevant && (
                    <span style={{
                      background: 'rgba(74, 127, 203, 0.2)',
                      border: '1px solid rgba(74, 127, 203, 0.4)',
                      color: 'var(--color-magic-bright)',
                      fontSize: '0.65rem',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '3px'
                    }}>
                      Case Relevant
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.2rem', color: 'var(--color-gold-bright)', marginTop: '0.5rem', marginBottom: '0.75rem' }}>
                  {entry.title}
                </h3>

                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
                  {entry.content}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
                {entry.tags.map(t => (
                  <span
                    key={t}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      fontSize: '0.7rem',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '3px',
                      color: 'var(--color-text-secondary)'
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
