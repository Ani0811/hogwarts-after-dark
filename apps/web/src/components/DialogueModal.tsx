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
      text: `${character.public_facts[0] || "I'm willing to answer your questions, Investigator."}`,
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
        { sender: 'suspect', text: '"I have nothing further to add to that question, Investigator."', isAi: false }
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
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(5, 5, 15, 0.85)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem'
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '700px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem',
        border: '1px solid var(--color-gold)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.8)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, color: 'var(--color-gold-bright)', fontSize: '1.35rem' }}>
                {character.name}
              </h3>
              <span style={{
                background: 'rgba(201,168,76,0.15)',
                color: 'var(--color-gold)',
                fontSize: '0.75rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '3px'
              }}>
                {character.role}
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              {character.portrait_description}
            </p>
          </div>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.85rem' }}>
            ✕ Close
          </button>
        </div>

        {/* AI status banner */}
        <div style={{
          marginTop: '0.5rem',
          padding: '0.35rem 0.75rem',
          borderRadius: '4px',
          fontSize: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: companionStatus.connected && companionStatus.aiAvailable ? 'rgba(64,160,96,0.1)' : 'rgba(201,168,76,0.08)',
          border: '1px solid rgba(201,168,76,0.15)'
        }}>
          <span>
            {companionStatus.connected && companionStatus.aiAvailable
              ? `⚡ AI Dialogue Active via LM Studio (${companionStatus.aiModel?.split('/').pop() || 'Local'})`
              : `📖 In-Game Dialogue Engine Active (Offline/Demo Mode)`}
          </span>
          <span style={{ color: 'var(--color-text-muted)' }}>
            Knowledge bounded by case rules
          </span>
        </div>

        {/* Conversation transcript */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: m.sender === 'investigator' ? 'flex-end' : 'flex-start',
                maxWidth: '82%',
                background: m.sender === 'investigator'
                  ? 'rgba(74, 127, 203, 0.2)'
                  : 'rgba(201, 168, 76, 0.12)',
                border: `1px solid ${m.sender === 'investigator' ? 'rgba(74,127,203,0.4)' : 'rgba(201,168,76,0.3)'}`,
                borderRadius: '8px',
                padding: '0.75rem 1rem'
              }}
            >
              <div style={{
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: m.sender === 'investigator' ? 'var(--color-magic-bright)' : 'var(--color-gold)',
                marginBottom: '0.25rem',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>{m.sender === 'investigator' ? 'You' : character.name}</span>
                {m.sender === 'suspect' && (
                  <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>
                    {m.isAi ? '⚡ Local AI' : '📜 Engine'}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.92rem', color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem', fontStyle: 'italic', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
              {character.name} is considering their response...
            </div>
          )}
        </div>

        {/* Suggested quick inquiries */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
            Suggested Inquiries:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                disabled={loading}
                onClick={() => handleSend(q)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(201,168,76,0.2)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                "{q}"
              </button>
            ))}
          </div>
        </div>

        {/* Freeform input */}
        <form
          onSubmit={e => {
            e.preventDefault()
            handleSend()
          }}
          style={{ display: 'flex', gap: '0.5rem' }}
        >
          <input
            type="text"
            value={inputQuestion}
            onChange={e => setInputQuestion(e.target.value)}
            placeholder={`Ask ${character.name} a specific question...`}
            disabled={loading}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !inputQuestion.trim()}>
            {loading ? 'Consulting...' : 'Ask ➔'}
          </button>
        </form>
      </div>
    </div>
  )
}
