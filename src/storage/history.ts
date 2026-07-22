import type { Mode, Duration } from '../engine/types'
import type { Metrics } from '../engine/metrics'

const KEY = 'typepilot.sessions'

export type TypingSession = {
  id: string
  mode: Mode
  durationSeconds: Duration
  grossWpm: number
  netWpm: number
  accuracy: number
  consistency: number
  correctCharacters: number
  incorrectCharacters: number
  backspaceCount: number
  completedAt: string
  timeline: number[]
  mistypedLetters: Record<string, number>
}

export function buildSession(input: {
  mode: Mode
  durationSeconds: Duration
  metrics: Metrics
  id: string
  completedAt: string
}): TypingSession {
  const { mode, durationSeconds, metrics, id, completedAt } = input
  return {
    id,
    mode,
    durationSeconds,
    grossWpm: metrics.grossWpm,
    netWpm: metrics.netWpm,
    accuracy: metrics.accuracy,
    consistency: metrics.consistency,
    correctCharacters: metrics.correctCharacters,
    incorrectCharacters: metrics.incorrectCharacters,
    backspaceCount: metrics.backspaceCount,
    completedAt,
    timeline: metrics.timeline,
    mistypedLetters: metrics.mistypedLetters,
  }
}

export function loadSessions(): TypingSession[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as TypingSession[]) : []
  } catch {
    return []
  }
}

export function saveSession(session: TypingSession): void {
  const all = loadSessions()
  all.push(session)
  localStorage.setItem(KEY, JSON.stringify(all))
}

export function personalBest(sessions: TypingSession[]): number {
  return sessions.reduce((best, s) => Math.max(best, s.netWpm), 0)
}

export function isPersonalBest(sessions: TypingSession[], netWpm: number): boolean {
  return netWpm > personalBest(sessions)
}
