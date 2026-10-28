import React, { useState } from 'react'
import { Character, CompanionStatus } from '../types/game'

interface DialogueModalProps {
  character: Character
  onClose: () => void
  onAsk: (question: string) => Promise<{ dialogue: string; isAi: boolean }>
  companionStatus: CompanionStatus
}

interface Message {
  sender: 'investigator' | 'suspect'
  text: string
  isAi?: boolean
}

export const DialogueModal: React.FC<DialogueModalProps> = ({
  character,
  onClose,
  onAsk,
  companionStatus
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'suspect',
      text: `${character.public_facts[0] || "I'm willing to answer your inquiries, Investigator."}`,
      isAi: false
    }
  ])
  const [inputQuestion, setInputQuestion] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async (questionText?: string) => {
    const textToSend = (questionText || inputQuestion).trim()
    if (!textToSend || loading) return

    setMessages(prev => [...prev, { sender: 'investigator', text: textToSend }])
    setInputQuestion('')
    setLoading(true)

    try {
      const res = await onAsk(textToSend)
      setMessages(prev => [
        ...prev,
        { sender: 'suspect', text: res.dialogue, isAi: res.isAi }
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        { sender: 'suspect', text: '"I have nothing further to disclose on that matter, Investigator."', isAi: false }
      ])
    } finally {
      setLoading(false)
    }
  }

  const suggestedQuestions = [
    `Where were you around ten o'clock tonight?`,
    `What do you know about the missing Hourglass?`,
    `Did you notice anyone near the Archivist's tea or study?`,
    `What work brought you out of your quarters at this hour?`
  ]

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(4, 5, 10, 0.88)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '1.5rem'
    }}>
      <div className="arcane-panel has-corners" style={{
        width: '100%',
        maxWidth: '780px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.75rem',
        background: '#0c0e1a',
        border: '1px solid var(--gold-pure)',
        boxShadow: '0 12px 48px rgba(0,0,0,0.9), 0 0 24px rgba(212,175,55,0.2)'
      }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--gold-border)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(244,63,94,0.2) 0%, rgba(10,11,20,0.9) 100%)',
              border: '1px solid var(--status-ruby)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>
              👤
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.4rem' }}>
                  <span className="gold-gradient-text">{character.name}</span>
                </h3>
                <span className="badge badge-ruby" style={{ fontSize: '0.65rem' }}>
                  {character.role}
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {character.portrait_description}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-stealth" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
            ✕ Conclude Interrogation
          </button>
        </div>

        {/* AI & Telemetry Banner */}
        <div style={{
          marginTop: '0.75rem',
          padding: '0.45rem 0.85rem',
          borderRadius: '6px',
          fontSize: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: companionStatus.connected && companionStatus.aiAvailable ? 'rgba(16,185,129,0.12)' : 'rgba(212,175,55,0.08)',
          border: '1px solid var(--gold-border)'
        }}>
          <span style={{ fontWeight: 600, color: companionStatus.connected && companionStatus.aiAvailable ? '#6ee7b7' : 'var(--text-gold)' }}>
            {companionStatus.connected && companionStatus.aiAvailable
              ? `⚡ Local AI Active: ${companionStatus.aiModel?.split('/').pop() || 'LM Studio'}`
              : `📖 In-Game Narrative Engine Active (Zero AI Dependency / Demo Mode)`}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            Character Knowledge Strictly Bounded
          </span>
        </div>

        {/* Transcript Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: m.sender === 'investigator' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background: m.sender === 'investigator'
                  ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.25) 0%, rgba(10, 15, 30, 0.9) 100%)'
                  : 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(16, 18, 30, 0.95) 100%)',
                border: `1px solid ${m.sender === 'investigator' ? 'rgba(56,189,248,0.4)' : 'var(--gold-border)'}`,
                borderRadius: '8px',
                padding: '0.85rem 1.15rem',
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: m.sender === 'investigator' ? 'var(--magic-cyan-bright)' : 'var(--gold-bright)',
                marginBottom: '0.35rem',
                display: 'flex',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <span>{m.sender === 'investigator' ? 'Investigator (You)' : character.name}</span>
                {m.sender === 'suspect' && (
                  <span style={{ fontSize: '0.65rem', opacity: 0.85, fontWeight: 500 }}>
                    {m.isAi ? '⚡ Local AI' : '📜 Engine'}
                  </span>
                )}
              </div>
              <div className="font-lore" style={{ fontSize: '1.05rem', color: 'var(--text-heading)', lineHeight: 1.6 }}>
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{
              alignSelf: 'flex-start',
              padding: '0.65rem 1rem',
              fontStyle: 'italic',
              color: 'var(--gold-glow)',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span className="status-dot status-dot--amber" style={{ animation: 'pulseRune 1s infinite' }} />
              {character.name} is considering their response...
            </div>
          )}
        </div>

        {/* Quick Inquiry Chips */}
        <div style={{ borderTop: '1px solid var(--gold-border)', paddingTop: '0.85rem', marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
            Investigative Questions:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                disabled={loading}
                onClick={() => handleSend(q)}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(212, 175, 55, 0.25)',
                  color: 'var(--text-body)',
                  fontSize: '0.76rem',
                  padding: '0.3rem 0.6rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--gold-pure)'
                  e.currentTarget.style.color = 'var(--gold-bright)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.25)'
                  e.currentTarget.style.color = 'var(--text-body)'
                }}
              >
                "{q}"
              </button>
            ))}
          </div>
        </div>

        {/* Freeform Prompt Bar */}
        <form
          onSubmit={e => {
            e.preventDefault()
            handleSend()
          }}
          style={{ display: 'flex', gap: '0.65rem' }}
        >
          <input
            type="text"
            value={inputQuestion}
            onChange={e => setInputQuestion(e.target.value)}
            placeholder={`Pose a direct inquiry to ${character.name}...`}
            disabled={loading}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-gold" disabled={loading || !inputQuestion.trim()}>
            {loading ? 'Inquiring...' : 'Inquire ➔'}
          </button>
        </form>
      </div>
    </div>
  )
}
