import type { Metrics } from '../engine/metrics'
import type { Mode, Duration } from '../engine/types'
import type { TypingSession } from '../storage/history'

export type CoachInput = {
  netWpm: number
  grossWpm: number
  accuracy: number
  consistency: number
  weakLetters: string[]
  slowestWords: string[]
  backspaceCount: number
  recentAverageWpm: number
  mode: Mode
  durationSeconds: Duration
}

export type CoachAnalysis = {
  strength: string
  weakness: string
  recommendation: string
  exerciseType: string
}

export function buildCoachInput(
  metrics: Metrics,
  mode: Mode,
  durationSeconds: Duration,
  history: TypingSession[],
): CoachInput {
  const weakLetters = Object.entries(metrics.mistypedLetters)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([letter]) => letter)

  const recentAverageWpm = history.length
    ? Math.round(history.reduce((sum, s) => sum + s.netWpm, 0) / history.length)
    : 0

  return {
    netWpm: metrics.netWpm,
    grossWpm: metrics.grossWpm,
    accuracy: metrics.accuracy,
    consistency: metrics.consistency,
    weakLetters,
    slowestWords: metrics.slowestWords.map((w) => w.word),
    backspaceCount: metrics.backspaceCount,
    recentAverageWpm,
    mode,
    durationSeconds,
  }
}
