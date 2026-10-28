import React, { useState, useEffect } from 'react'
import { InvestigationSession, CompanionStatus, Character } from '../types/game'
import { gameService } from '../services/api'
import { CHARACTERS } from '../services/caseData'
import { Header } from '../components/Header'
import { CastleMap } from '../components/CastleMap'
import { LocationView } from '../components/LocationView'
import { EvidenceBoard } from '../components/EvidenceBoard'
import { RestrictedSection } from '../components/RestrictedSection'
import { PensieveJournal } from '../components/PensieveJournal'
import { VerdictScreen } from '../components/VerdictScreen'
import { SetupScreen } from '../components/SetupScreen'
import { DialogueModal } from '../components/DialogueModal'

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('map')
  const [session, setSession] = useState<InvestigationSession>(() => {
    return gameService.loadSession() || gameService.createSession()
  })
  const [companionStatus, setCompanionStatus] = useState<CompanionStatus>({
    connected: false,
    checking: true,
    url: gameService.getCompanionUrl()
  })
  const [activeDialogueCharacter, setActiveDialogueCharacter] = useState<Character | null>(null)
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'success' | 'warn' } | null>(null)

  const showNotification = (message: string, type: 'info' | 'success' | 'warn' = 'info') => {
    setNotification({ message, type })
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev))
    }, 4500)
  }

  const checkCompanion = async () => {
    setCompanionStatus(prev => ({ ...prev, checking: true }))
    const status = await gameService.checkCompanionStatus()
    setCompanionStatus(status)
  }

  useEffect(() => {
    checkCompanion()
  }, [])

  // Action handlers
  const handleMoveTo = async (locationId: string) => {
    const res = await gameService.moveTo(session, locationId)
    setSession({ ...res.session })
    showNotification(res.message, res.success ? 'info' : 'warn')
  }

  const handleInspectClue = async (clueId: string) => {
    const res = await gameService.inspectClue(session, clueId)
    setSession({ ...res.session })
    showNotification(res.message, res.success ? 'success' : 'warn')
  }

  const handleCastSpell = async (spellId: string) => {
    const res = await gameService.castSpell(session, spellId)
    setSession({ ...res.session })
    showNotification(res.message, res.success ? 'success' : 'warn')
  }

  const handleInterviewStart = (characterId: string) => {
    const char = CHARACTERS[characterId]
    if (char) {
      setActiveDialogueCharacter(char)
    }
  }

  const handleAskQuestion = async (question: string) => {
    if (!activeDialogueCharacter) {
      return { dialogue: '', isAi: false }
    }
    const res = await gameService.interviewCharacter(session, activeDialogueCharacter.id, question)
    setSession({ ...res.session })
    return { dialogue: res.dialogue, isAi: res.isAi }
  }

  const handleSubmitHypothesis = async (hypothesis: string, evidenceIds: string[]) => {
    const updated = await gameService.submitHypothesis(session, hypothesis, evidenceIds)
    setSession({ ...updated })
    showNotification('Investigative theory recorded in the Pensieve.', 'success')
  }

  const handleSubmitVerdict = async (culpritId: string, evidenceIds: string[]) => {
    const res = await gameService.submitVerdict(session, culpritId, evidenceIds)
    setSession({ ...res.session })
    showNotification(res.correct ? 'CASE SOLVED!' : 'Verdict rejected.', res.correct ? 'success' : 'warn')
    return { correct: res.correct, message: res.message }
  }

  const handleReset = () => {
    if (window.confirm('Reset this investigation? All discovered clues and progress will be cleared.')) {
      gameService.clearSession()
      const newSession = gameService.createSession()
      setSession(newSession)
      showNotification('Investigation reset. The night begins anew.', 'info')
      setCurrentTab('map')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header & Navigation */}
      <Header
        currentTab={currentTab}
        setTab={setCurrentTab}
        manaPoints={session.manaPoints}
        companionStatus={companionStatus}
        onRefreshCompanion={checkCompanion}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 90,
          background: notification.type === 'success'
            ? 'rgba(40, 90, 50, 0.95)'
            : notification.type === 'warn'
            ? 'rgba(100, 50, 30, 0.95)'
            : 'rgba(25, 30, 60, 0.95)',
          border: `1px solid ${
            notification.type === 'success'
              ? 'var(--color-success)'
              : notification.type === 'warn'
              ? 'var(--color-warning)'
              : 'var(--color-gold)'
          }`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          borderRadius: '8px',
          padding: '0.85rem 1.25rem',
          maxWidth: '420px',
          color: '#fff',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          backdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <span style={{ fontSize: '1.25rem' }}>
            {notification.type === 'success' ? '✨' : notification.type === 'warn' ? '⚠️' : '📜'}
          </span>
          <span style={{ lineHeight: 1.4 }}>{notification.message}</span>
        </div>
      )}

      {/* Main Content View */}
      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '1.5rem' }}>
        {currentTab === 'map' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <CastleMap session={session} onMoveTo={handleMoveTo} />
            <LocationView
              session={session}
              onInspectClue={handleInspectClue}
              onInterview={handleInterviewStart}
              onCastSpell={handleCastSpell}
              onMoveTo={handleMoveTo}
            />
          </div>
        )}

        {currentTab === 'evidence' && (
          <EvidenceBoard session={session} onSubmitHypothesis={handleSubmitHypothesis} />
        )}

        {currentTab === 'archive' && <RestrictedSection />}

        {currentTab === 'pensieve' && (
          <PensieveJournal session={session} onReset={handleReset} />
        )}

        {currentTab === 'verdict' && (
          <VerdictScreen session={session} onSubmitVerdict={handleSubmitVerdict} />
        )}

        {currentTab === 'setup' && (
          <SetupScreen companionStatus={companionStatus} onRefreshCompanion={checkCompanion} />
        )}
      </main>

      {/* Character Interrogation Dialogue Modal */}
      {activeDialogueCharacter && (
        <DialogueModal
          character={activeDialogueCharacter}
          onClose={() => setActiveDialogueCharacter(null)}
          onAsk={handleAskQuestion}
          companionStatus={companionStatus}
        />
      )}

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '1.5rem',
        borderTop: '1px solid var(--color-border)',
        fontSize: '0.8rem',
        color: 'var(--color-text-secondary)',
        background: '#080814'
      }}>
        <p style={{ margin: 0 }}>
          <strong>Hogwarts After Dark</strong> — An unofficial magical investigation game powered by local open-weight AI.
        </p>
        <p style={{ margin: '0.35rem 0 0 0', color: 'var(--color-text-muted)' }}>
          Zero paid APIs • 100% Client-Side Fallback • Private Local Inference via LM Studio • MIT License
        </p>
      </footer>
    </div>
  )
}

export default App

