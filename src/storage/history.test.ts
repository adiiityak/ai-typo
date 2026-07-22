import { describe, it, expect, beforeEach } from 'vitest'
import {
  buildSession, saveSession, loadSessions, personalBest, isPersonalBest,
} from './history'
import type { Metrics } from '../engine/metrics'

const metrics: Metrics = {
  grossWpm: 60, netWpm: 55, accuracy: 96, consistency: 80,
  correctCharacters: 300, incorrectCharacters: 12, backspaceCount: 4,
  mistypedLetters: { r: 3 }, slowestWords: [{ word: 'through', seconds: 0.9 }],
  timeline: [50, 55, 60],
}

describe('buildSession', () => {
  it('assembles a session from metrics + config', () => {
    const s = buildSession({ mode: 'words', durationSeconds: 60, metrics, id: 'x1', completedAt: '2026-07-22T00:00:00.000Z' })
    expect(s).toMatchObject({ id: 'x1', mode: 'words', durationSeconds: 60, netWpm: 55, accuracy: 96 })
    expect(s.timeline).toEqual([50, 55, 60])
  })
})

describe('persistence', () => {
  beforeEach(() => localStorage.clear())

  it('saves and loads sessions', () => {
    const s = buildSession({ mode: 'quotes', durationSeconds: 30, metrics, id: 'a', completedAt: '2026-07-22T00:00:00.000Z' })
    saveSession(s)
    expect(loadSessions()).toHaveLength(1)
    expect(loadSessions()[0].id).toBe('a')
  })

  it('returns [] when nothing saved', () => {
    expect(loadSessions()).toEqual([])
  })

  it('tolerates corrupt storage', () => {
    localStorage.setItem('typepilot.sessions', 'not json')
    expect(loadSessions()).toEqual([])
  })
})

describe('personalBest', () => {
  const mk = (net: number, id: string) =>
    buildSession({ mode: 'words', durationSeconds: 60, metrics: { ...metrics, netWpm: net }, id, completedAt: '2026-07-22T00:00:00.000Z' })

  it('is the max netWpm', () => {
    expect(personalBest([mk(40, '1'), mk(62, '2'), mk(51, '3')])).toBe(62)
  })
  it('is 0 for empty history', () => {
    expect(personalBest([])).toBe(0)
  })
  it('isPersonalBest true when strictly greater than prior best', () => {
    const prior = [mk(50, '1')]
    expect(isPersonalBest(prior, 55)).toBe(true)
    expect(isPersonalBest(prior, 50)).toBe(false)
  })
})
