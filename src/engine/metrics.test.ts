import { describe, it, expect } from 'vitest'
import { computeMetrics } from './metrics'
import { createEngine, applyKey } from './keystroke'
import type { EngineState } from './types'

function type(target: string, text: string, msPerChar = 100): EngineState {
  let s = createEngine(target)
  text.split('').forEach((ch, i) => {
    s = applyKey(s, { type: 'char', char: ch, now: 1000 + i * msPerChar })
  })
  return s
}

describe('computeMetrics', () => {
  it('computes gross WPM as chars/5/minutes', () => {
    // 60 correct chars in 60s => 12 words / 1 min = 12 wpm
    const s = type('a'.repeat(60), 'a'.repeat(60))
    const m = computeMetrics(s, 60)
    expect(m.grossWpm).toBeCloseTo(12, 5)
  })

  it('computes 100% accuracy for all-correct input', () => {
    const s = type('abcde', 'abcde')
    const m = computeMetrics(s, 60)
    expect(m.accuracy).toBeCloseTo(100, 5)
    expect(m.correctCharacters).toBe(5)
    expect(m.incorrectCharacters).toBe(0)
  })

  it('reduces accuracy and net WPM for errors', () => {
    // target 'aaaaa', typed 'aaxaa' => 4 correct, 1 wrong of 5
    const s = type('aaaaa', 'aaxaa')
    const m = computeMetrics(s, 60)
    expect(m.accuracy).toBeCloseTo(80, 5)
    expect(m.incorrectCharacters).toBe(1)
    expect(m.netWpm).toBeLessThan(m.grossWpm)
  })

  it('floors net WPM at 0', () => {
    const s = type('aaaaa', 'xxxxx')
    const m = computeMetrics(s, 60)
    expect(m.netWpm).toBe(0)
  })

  it('aggregates mistyped letters by expected character', () => {
    const s = type('rte', 'xxe')
    const m = computeMetrics(s, 60)
    expect(m.mistypedLetters).toEqual({ r: 1, t: 1 })
  })

  it('reports the backspace count from state', () => {
    let s = type('abc', 'ax')
    s = applyKey(s, { type: 'backspace', now: 5000 })
    const m = computeMetrics(s, 60)
    expect(m.backspaceCount).toBe(1)
  })

  it('returns a per-second timeline of cumulative WPM', () => {
    // 24 chars over 2 seconds (12/sec) => cumulative wpm ~ [144, 144]
    const s = type('a'.repeat(24), 'a'.repeat(24), 1000 / 12)
    const m = computeMetrics(s, 2)
    expect(m.timeline).toHaveLength(2)
    expect(m.timeline[1]).toBeCloseTo(144, 0)
  })

  it('returns consistency between 0 and 100', () => {
    const s = type('a'.repeat(24), 'a'.repeat(24), 1000 / 12)
    const m = computeMetrics(s, 2)
    expect(m.consistency).toBeGreaterThanOrEqual(0)
    expect(m.consistency).toBeLessThanOrEqual(100)
  })

  it('identifies slowest words by typing duration', () => {
    // 'go slow' — type 'go ' fast, 'slow' slow
    let s = createEngine('go slow')
    const times = [0, 50, 100, 150, 900, 1650, 2400] // per-char cumulative ms
    'go slow'.split('').forEach((ch, i) => {
      s = applyKey(s, { type: 'char', char: ch, now: 1000 + times[i] })
    })
    const m = computeMetrics(s, 60)
    expect(m.slowestWords[0].word).toBe('slow')
  })

  it('handles zero elapsed time without dividing by zero', () => {
    const m = computeMetrics(createEngine('abc'), 0)
    expect(m.grossWpm).toBe(0)
    expect(m.accuracy).toBe(0)
  })
})
