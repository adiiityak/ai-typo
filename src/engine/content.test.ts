import { describe, it, expect } from 'vitest'
import { generateWords, randomQuote, buildTarget } from './content'

describe('generateWords', () => {
  it('returns the requested number of space-separated words', () => {
    const out = generateWords(10)
    expect(out.split(' ')).toHaveLength(10)
  })
  it('returns only lowercase letters and spaces', () => {
    expect(generateWords(50)).toMatch(/^[a-z ]+$/)
  })
  it('is deterministic given a seeded rng', () => {
    const seeded = () => {
      let i = 0
      return () => (i++ % 7) / 7
    }
    expect(generateWords(5, seeded())).toBe(generateWords(5, seeded()))
  })
})

describe('randomQuote', () => {
  it('returns a non-empty string', () => {
    expect(randomQuote(() => 0).length).toBeGreaterThan(0)
  })
  it('respects the pick function to choose an index', () => {
    const first = randomQuote(() => 0)
    const second = randomQuote(() => 1)
    expect(first).not.toBe(second)
  })
})

describe('buildTarget', () => {
  it('words mode generates a long passage', () => {
    expect(buildTarget('words', 60, () => 0.5).length).toBeGreaterThan(200)
  })
  it('quotes mode returns a single quote', () => {
    const t = buildTarget('quotes', 30, () => 0)
    expect(t).not.toContain('  ')
    expect(t.length).toBeGreaterThan(0)
  })
})
