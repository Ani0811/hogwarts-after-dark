/**
 * Hogwarts After Dark — TypeScript Domain Types
 */

export interface Clue {
  id: string
  title: string
  description: string
  location_id: string
  requires_spell?: string | null
  tags: string[]
  is_misleading: boolean
}

export interface Character {
  id: string
  name: string
  role: string
  personality: string
  dialogue_style: string
  appearance: string
  location_id: string
  is_suspect: boolean
  portrait_description: string
  public_facts: string[]
  known_clue_ids: string[]
}

export interface Location {
  id: string
  name: string
  description: string
  atmosphere: string
  state: 'accessible' | 'restricted' | 'locked'
  connected_locations: string[]
  available_clue_ids: string[]
  character_ids: string[]
  access_restriction?: string | null
  requires_spell?: string | null
}

export interface Spell {
  id: string
  name: string
  incantation: string
  description: string
  category: 'revelation' | 'examination' | 'illumination' | 'detection' | 'protection'
  effect: string
  target_type: 'location' | 'clue' | 'character' | 'self'
  reveals_clues: boolean
  cost: number
}

export interface LoreEntry {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  case_relevant: boolean
}

export interface Case {
  id: string
  title: string
  description: string
  introduction: string
  suspect_ids: string[]
  location_ids: string[]
  clue_ids: string[]
  spell_ids: string[]
}

export interface InvestigationEvent {
  event_type: string
  timestamp: string
  details: Record<string, any>
}

export interface Hypothesis {
  hypothesis: string
  timestamp: string
  evidence_referenced: string[]
}

export interface InvestigationSession {
  sessionId: string
  caseId: string
  currentLocationId: string
  discoveredClueIds: string[]
  examinedClueIds: string[]
  interviewedCharacterIds: string[]
  castSpells: string[]
  manaPoints: number
  hypotheses: Hypothesis[]
  history: InvestigationEvent[]
  verdictSubmitted: boolean
  verdictCorrect: boolean | null
}

export interface CompanionStatus {
  connected: boolean
  checking: boolean
  url: string
  version?: string
  aiAvailable?: boolean
  aiModel?: string | null
  provider?: string
  error?: string | null
}
