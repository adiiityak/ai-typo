import { describe, it, expect } from 'vitest'
import { computeDashboardStats, practiceStreak } from './stats'
import type { TypingSession } from '../storage/history'

function session(overrides: Partial<TypingSession>): TypingSession {
  return {
    id: Math.random().toString(), mode: 'words', durationSeconds: 60,
    grossWpm: 60, netWpm: 55, accuracy: 95, consistency: 80,
    correctCharacters: 100, incorrectCharacters: 5, backspaceCount: 2,
    completedAt: '2026-07-20T10:00:00.000Z', timeline: [], mistypedLetters: {},
    ...overrides,
  }
}

describe('computeDashboardStats', () => {
  it('returns zeroed stats for empty history', () => {
    const s = computeDashboardStats([])
    expect(s).toMatchObject({ currentWpm: 0, bestWpm: 0, averageAccuracy: 0, totalTests: 0, totalSeconds: 0, streakDays: 0 })
    expect(s.weakLetters).toEqual([])
    expect(s.series).toEqual([])
  })

  it('computes current (newest), best, average accuracy, totals', () => {
    const s = computeDashboardStats([
      session({ netWpm: 40, accuracy: 90, durationSeconds: 30, completedAt: '2026-07-20T10:00:00.000Z' }),
      session({ netWpm: 62, accuracy: 96, durationSeconds: 60, completedAt: '2026-07-21T10:00:00.000Z' }),
      session({ netWpm: 51, accuracy: 100, durationSeconds: 60, completedAt: '2026-07-22T10:00:00.000Z' }),
    ])
    expect(s.currentWpm).toBe(51)     // newest by completedAt
    expect(s.bestWpm).toBe(62)
    expect(s.averageAccuracy).toBe(95) // (90+96+100)/3 = 95.33 -> 95
    expect(s.totalTests).toBe(3)
    expect(s.totalSeconds).toBe(150)
    expect(s.series.map((p) => p.netWpm)).toEqual([40, 62, 51]) // oldest -> newest
  })

  it('counts a consecutive-day streak ending at the most recent test', () => {
    const s = computeDashboardStats([
      session({ completedAt: '2026-07-21T10:00:00.000Z' }),
      session({ completedAt: '2026-07-22T09:00:00.000Z' }),
      session({ completedAt: '2026-07-23T08:00:00.000Z' }),
    ])
    expect(s.streakDays).toBe(3)
  })

  it('breaks the streak on a gap', () => {
    const s = computeDashboardStats([
      session({ completedAt: '2026-07-20T10:00:00.000Z' }),
      session({ completedAt: '2026-07-23T10:00:00.000Z' }), // gap on 21 & 22
    ])
    expect(s.streakDays).toBe(1)
  })

  it('treats a single day as a 1-day streak', () => {
    expect(computeDashboardStats([session({})]).streakDays).toBe(1)
  })

  it('aggregates weak letters across sessions, most-missed first', () => {
    const s = computeDashboardStats([
      session({ mistypedLetters: { r: 3, t: 1 } }),
      session({ mistypedLetters: { r: 2, e: 4 } }),
    ])
    expect(s.weakLetters[0]).toEqual({ letter: 'r', count: 5 })
    expect(s.weakLetters).toContainEqual({ letter: 'e', count: 4 })
    expect(s.weakLetters).toContainEqual({ letter: 't', count: 1 })
  })
})

describe('practiceStreak', () => {
  it('is 0 for empty history', () => {
    expect(practiceStreak([])).toBe(0)
  })
  it('counts consecutive days regardless of input order', () => {
    const s = [
      session({ completedAt: '2026-07-23T08:00:00.000Z' }),
      session({ completedAt: '2026-07-21T10:00:00.000Z' }),
      session({ completedAt: '2026-07-22T09:00:00.000Z' }),
    ]
    expect(practiceStreak(s)).toBe(3)
  })
})
