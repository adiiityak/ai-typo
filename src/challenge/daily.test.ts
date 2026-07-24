import { describe, it, expect } from 'vitest'
import { computeDailyChallenge, DAILY_GOAL_TESTS } from './daily'
import type { TypingSession } from '../storage/history'

function session(overrides: Partial<TypingSession>): TypingSession {
  return {
    id: Math.random().toString(), mode: 'words', durationSeconds: 60,
    grossWpm: 60, netWpm: 55, accuracy: 95, consistency: 80,
    correctCharacters: 100, incorrectCharacters: 5, backspaceCount: 2,
    completedAt: '2026-07-23T10:00:00.000Z', timeline: [], mistypedLetters: {},
    ...overrides,
  }
}

const TODAY = '2026-07-23'

describe('computeDailyChallenge', () => {
  it('reports an empty day for no history', () => {
    const c = computeDailyChallenge([], TODAY)
    expect(c).toMatchObject({ goalTests: DAILY_GOAL_TESTS, completedToday: 0, done: false, bestAccuracyToday: null, streakDays: 0 })
  })

  it("counts only today's sessions and tracks best accuracy today", () => {
    const c = computeDailyChallenge([
      session({ accuracy: 91, completedAt: '2026-07-23T09:00:00.000Z' }),
      session({ accuracy: 97, completedAt: '2026-07-23T11:00:00.000Z' }),
      session({ accuracy: 99, completedAt: '2026-07-22T11:00:00.000Z' }), // yesterday
    ], TODAY)
    expect(c.completedToday).toBe(2)
    expect(c.bestAccuracyToday).toBe(97)
    expect(c.done).toBe(false)
  })

  it('is done once the goal number of tests is reached today', () => {
    const c = computeDailyChallenge([
      session({ completedAt: '2026-07-23T08:00:00.000Z' }),
      session({ completedAt: '2026-07-23T09:00:00.000Z' }),
      session({ completedAt: '2026-07-23T10:00:00.000Z' }),
    ], TODAY)
    expect(c.completedToday).toBe(3)
    expect(c.done).toBe(true)
  })

  it('includes the practice streak', () => {
    const c = computeDailyChallenge([
      session({ completedAt: '2026-07-22T10:00:00.000Z' }),
      session({ completedAt: '2026-07-23T10:00:00.000Z' }),
    ], TODAY)
    expect(c.streakDays).toBe(2)
  })
})
