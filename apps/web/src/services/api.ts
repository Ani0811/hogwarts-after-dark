/**
 * Hogwarts After Dark — API & Game Engine Service Layer
 * Supports both Live Local Companion Mode and Standalone In-Browser Demo Mode.
 */

import {
  CompanionStatus,
  InvestigationSession,
  LoreEntry,
} from '../types/game'
import {
  CHARACTERS,
  CLUES,
  LOCATIONS,
  SPELLS,
  LORE
} from './caseData'

const COMPANION_URL_KEY = 'had_companion_url'
const PAIRING_TOKEN_KEY = 'had_pairing_token'
const SESSION_STORAGE_KEY = 'had_investigation_session'

export class GameService {
  private companionUrl: string = localStorage.getItem(COMPANION_URL_KEY) || 'http://127.0.0.1:8765'
  private pairingToken: string = localStorage.getItem(PAIRING_TOKEN_KEY) || ''

  getCompanionUrl(): string {
    return this.companionUrl
  }

  setCompanionUrl(url: string) {
    this.companionUrl = url.replace(/\/+$/, '')
    localStorage.setItem(COMPANION_URL_KEY, this.companionUrl)
  }

  getPairingToken(): string {
    return this.pairingToken
  }

  setPairingToken(token: string) {
    this.pairingToken = token.trim()
    localStorage.setItem(PAIRING_TOKEN_KEY, this.pairingToken)
  }

  async checkCompanionStatus(): Promise<CompanionStatus> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000)

      const res = await fetch(`${this.companionUrl}/health`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      })
      clearTimeout(timeoutId)

      if (res.ok) {
        const data = await res.json()
        return {
          connected: true,
          checking: false,
          url: this.companionUrl,
          version: data.companion_version,
          aiAvailable: data.ai_available,
          aiModel: data.ai_model,
        }
      }
      return {
        connected: false,
        checking: false,
        url: this.companionUrl,
        error: `Companion returned HTTP ${res.status}`,
      }
    } catch (err: any) {
      return {
        connected: false,
        checking: false,
        url: this.companionUrl,
        error: err.name === 'AbortError' ? 'Connection timed out' : 'Companion service unreachable (Demo Mode Active)',
      }
    }
  }

  // --- Session Management ---

  createSession(caseId: string = 'case_001'): InvestigationSession {
    const session: InvestigationSession = {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      caseId,
      currentLocationId: 'loc_entrance_hall',
      discoveredClueIds: [],
      examinedClueIds: [],
      interviewedCharacterIds: [],
      castSpells: [],
      manaPoints: 20,
      hypotheses: [],
      history: [
        {
          event_type: 'investigation_started',
          timestamp: new Date().toISOString(),
          details: { caseId, locationId: 'loc_entrance_hall' }
        }
      ],
      verdictSubmitted: false,
      verdictCorrect: null,
    }
    this.saveSession(session)
    return session
  }

  loadSession(): InvestigationSession | null {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  saveSession(session: InvestigationSession) {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  }

  clearSession() {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  }

  // --- Actions ---

  async moveTo(session: InvestigationSession, targetLocationId: string): Promise<{ success: boolean; message: string; session: InvestigationSession }> {
    const currentLoc = LOCATIONS[session.currentLocationId]
    if (!currentLoc) return { success: false, message: 'Invalid location state.', session }

    if (!currentLoc.connected_locations.includes(targetLocationId)) {
      return { success: false, message: 'That location cannot be reached directly from here.', session }
    }

    const targetLoc = LOCATIONS[targetLocationId]
    if (!targetLoc) return { success: false, message: 'Unknown destination.', session }

    if (targetLoc.state === 'locked') {
      return { success: false, message: `Access to ${targetLoc.name} is sealed. ${targetLoc.access_restriction || ''}`, session }
    }

    session.currentLocationId = targetLocationId
    session.history.push({
      event_type: 'location_visited',
      timestamp: new Date().toISOString(),
      details: { locationId: targetLocationId, locationName: targetLoc.name }
    })
    this.saveSession(session)
    return { success: true, message: `You cautiously step into ${targetLoc.name}.`, session }
  }

  async inspectClue(session: InvestigationSession, clueId: string): Promise<{ success: boolean; message: string; clue?: any; session: InvestigationSession }> {
    const clue = CLUES[clueId]
    if (!clue) return { success: false, message: 'Clue not found.', session }

    if (clue.location_id !== session.currentLocationId) {
      return { success: false, message: 'That object is not present in this room.', session }
    }

    if (clue.requires_spell && !session.castSpells.includes(clue.requires_spell)) {
      const spell = SPELLS[clue.requires_spell]
      return {
        success: false,
        message: `A lingering magical concealment protects this item. You must cast ${spell ? spell.name : 'a specific spell'} first.`,
        session
      }
    }

    const isNew = !session.discoveredClueIds.includes(clueId)
    if (isNew) {
      session.discoveredClueIds.push(clueId)
    }
    if (!session.examinedClueIds.includes(clueId)) {
      session.examinedClueIds.push(clueId)
    }

    session.history.push({
      event_type: isNew ? 'clue_discovered' : 'clue_examined',
      timestamp: new Date().toISOString(),
      details: { clueId, title: clue.title }
    })
    this.saveSession(session)

    return {
      success: true,
      message: isNew ? `Discovery! You carefully inspect ${clue.title}.` : `Re-examining ${clue.title}.`,
      clue,
      session
    }
  }

  async castSpell(session: InvestigationSession, spellId: string): Promise<{ success: boolean; message: string; revealedClues?: string[]; session: InvestigationSession }> {
    const spell = SPELLS[spellId]
    if (!spell) return { success: false, message: 'Unknown spell incantation.', session }

    if (session.manaPoints < spell.cost) {
      return {
        success: false,
        message: `Your magical focus is depleted! Casting ${spell.name} requires ${spell.cost} MP (you have ${session.manaPoints}).`,
        session
      }
    }

    session.manaPoints -= spell.cost
    session.castSpells.push(spellId)

    const revealed: string[] = []
    if (spell.reveals_clues) {
      const currentLoc = LOCATIONS[session.currentLocationId]
      if (currentLoc) {
        for (const cid of currentLoc.available_clue_ids) {
          const c = CLUES[cid]
          if (c && c.requires_spell === spellId && !session.discoveredClueIds.includes(cid)) {
            session.discoveredClueIds.push(cid)
            revealed.push(c.title)
          }
        }
      }
    }

    session.history.push({
      event_type: 'spell_cast',
      timestamp: new Date().toISOString(),
      details: { spellId, spellName: spell.name, revealed }
    })
    this.saveSession(session)

    let msg = `"${spell.incantation}!" Wandlight surges forth — ${spell.effect}`
    if (revealed.length > 0) {
      msg += ` The magic reveals hidden evidence: ${revealed.join(', ')}!`
    }
    return { success: true, message: msg, revealedClues: revealed, session }
  }

  async interviewCharacter(
    session: InvestigationSession,
    characterId: string,
    playerQuestion?: string
  ): Promise<{ success: boolean; message: string; dialogue: string; isAi: boolean; session: InvestigationSession }> {
    const char = CHARACTERS[characterId]
    if (!char) return { success: false, message: 'Character not found.', dialogue: '', isAi: false, session }

    if (char.location_id !== session.currentLocationId) {
      return { success: false, message: `${char.name} is not present in this room.`, dialogue: '', isAi: false, session }
    }

    if (!session.interviewedCharacterIds.includes(characterId)) {
      session.interviewedCharacterIds.push(characterId)
    }

    session.history.push({
      event_type: 'character_interviewed',
      timestamp: new Date().toISOString(),
      details: { characterId, name: char.name, question: playerQuestion || 'General inquiry' }
    })
    this.saveSession(session)

    // Try AI companion if configured
    if (this.pairingToken && playerQuestion) {
      try {
        const aiRes = await fetch(`${this.companionUrl}/ai/dialogue`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Pairing-Token': this.pairingToken
          },
          body: JSON.stringify({
            session_id: session.sessionId,
            character_id: characterId,
            message: playerQuestion
          })
        })
        if (aiRes.ok) {
          const aiData = await aiRes.json()
          return {
            success: true,
            message: `Speaking with ${char.name}.`,
            dialogue: aiData.dialogue,
            isAi: !aiData.is_fallback,
            session
          }
        }
      } catch {
        // Fallback to deterministic dialogue
      }
    }

    // Deterministic dialogue response based on character knowledge
    let fallbackText = ''
    if (characterId === 'suspect_maris') {
      fallbackText = `"${char.public_facts[0]} I returned the cataloguing ledger promptly at 10:00 PM. ${char.public_facts[1]} The Archivist appeared absorbed in his work, but I did notice a student hurrying near the Herbarium later."`
    } else if (characterId === 'suspect_corvin') {
      fallbackText = `"${char.public_facts[0]} My alchemical thesis on chronomantic transmutation has hit a critical impasse. I was tending the crucible all night! If you find any unusual items, they surely belong to standard school research."`
    } else if (characterId === 'suspect_faelind') {
      fallbackText = `"${char.public_facts[1]} When I found the Archivist slumped over his desk, his pulse was slow and heavy. There was a distinct sweet, almond-like herbal scent in his cold tea cup. Someone gave him Dreamroot."`
    } else {
      fallbackText = `"${char.public_facts.join(' ')}"`
    }

    return {
      success: true,
      message: `Speaking with ${char.name}.`,
      dialogue: fallbackText,
      isAi: false,
      session
    }
  }

  async searchArchive(query: string): Promise<LoreEntry[]> {
    const q = query.toLowerCase().trim()
    if (!q) return []
    return LORE.filter(entry =>
      entry.title.toLowerCase().includes(q) ||
      entry.content.toLowerCase().includes(q) ||
      entry.tags.some(t => t.toLowerCase().includes(q))
    )
  }

  async submitHypothesis(session: InvestigationSession, hypothesis: string, evidenceIds: string[]): Promise<InvestigationSession> {
    session.hypotheses.push({
      hypothesis,
      timestamp: new Date().toISOString(),
      evidence_referenced: evidenceIds
    })
    session.history.push({
      event_type: 'hypothesis_submitted',
      timestamp: new Date().toISOString(),
      details: { hypothesis, evidenceIds }
    })
    this.saveSession(session)
    return session
  }

  async submitVerdict(
    session: InvestigationSession,
    culpritId: string,
    evidenceIds: string[]
  ): Promise<{ correct: boolean; message: string; session: InvestigationSession }> {
    // Authoritative check against the fixed solution: Corvin Ashwick with dreamroot tea + vial + torn page
    const isCorvin = culpritId === 'suspect_corvin'
    const hasTeacup = session.discoveredClueIds.includes('clue_teacup')
    const hasVial = session.discoveredClueIds.includes('clue_empty_vial')
    const hasTornPage = session.discoveredClueIds.includes('clue_torn_page')

    session.verdictSubmitted = true

    if (isCorvin && hasTeacup && hasVial && hasTornPage) {
      session.verdictCorrect = true
      session.history.push({
        event_type: 'verdict_submitted',
        timestamp: new Date().toISOString(),
        details: { culpritId, correct: true, evidenceCount: evidenceIds.length }
      })
      this.saveSession(session)
      return {
        correct: true,
        message: 'BRILLIANT DEDUCTION! Corvin Ashwick drugged the Archivist\'s tea with powdered Dreamroot to steal the Veiled Hourglass. He intended to rewind his catastrophic alchemical accident before thesis deadlines struck. Case solved with conclusive evidence!',
        session
      }
    } else if (isCorvin) {
      session.verdictCorrect = true
      session.history.push({
        event_type: 'verdict_submitted',
        timestamp: new Date().toISOString(),
        details: { culpritId, correct: true, partial: true }
      })
      this.saveSession(session)
      return {
        correct: true,
        message: 'PARTIAL SOLVE! You correctly identified Corvin Ashwick, but your investigative dossier lacks key physical evidence (the Dreamroot teacup, empty apothecary vial, or torn research page). The mystery is resolved, though further corroboration was needed.',
        session
      }
    } else {
      session.verdictCorrect = false
      session.history.push({
        event_type: 'verdict_submitted',
        timestamp: new Date().toISOString(),
        details: { culpritId, correct: false }
      })
      this.saveSession(session)
      return {
        correct: false,
        message: 'INSUFFICIENT PROOF! The evidence does not incriminate this individual beyond reasonable doubt. Re-examine the suspects, scrutinize the clues with your spells, and reconsider who possessed both motive and method.',
        session
      }
    }
  }
}

export const gameService = new GameService()
