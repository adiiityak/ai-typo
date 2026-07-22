import { describe, it, expect } from 'vitest'
import { buildCoachInput } from './summary'
import type { Metrics } from '../engine/metrics'
import type { TypingSession } from '../storage/history'

const metrics: Metrics = {
  grossWpm: 62, netWpm: 58, accuracy: 96, consistency: 81,
  correctCharacters: 290, incorrectCharacters: 12, backspaceCount: 5,
  mistypedLetters: { r: 5, t: 4, e: 3, a: 1 },
  slowestWords: [{ word: 'experience', seconds: 2.8 }, { word: 'particularly', seconds: 2.6 }],
  timeline: [40, 52, 58],
}

function session(netWpm: number): TypingSession {
  return {
    id: String(netWpm), mode: 'words', durationSeconds: 60, grossWpm: netWpm + 4, netWpm,
    accuracy: 95, consistency: 80, correctCharacters: 1, incorrectCharacters: 0,
    backspaceCount: 0, completedAt: '2026-07-22T00:00:00.000Z', timeline: [], mistypedLetters: {},
  }
}

describe('buildCoachInput', () => {
  it('derives weak letters (most-missed first) and slow words', () => {
    const input = buildCoachInput(metrics, 'words', 60, [])
    expect(input.weakLetters).toEqual(['r', 't', 'e', 'a'])
    expect(input.slowestWords).toEqual(['experience', 'particularly'])
  })

  it('copies the headline metrics', () => {
    const input = buildCoachInput(metrics, 'words', 60, [])
    expect(input).toMatchObject({ netWpm: 58, grossWpm: 62, accuracy: 96, consistency: 81, backspaceCount: 5, mode: 'words', durationSeconds: 60 })
  })

  it('computes recentAverageWpm from history (0 when empty)', () => {
    expect(buildCoachInput(metrics, 'words', 60, []).recentAverageWpm).toBe(0)
    expect(buildCoachInput(metrics, 'words', 60, [session(40), session(60)]).recentAverageWpm).toBe(50)
  })
})
