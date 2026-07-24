import { describe, it, expect } from 'vitest'
import { generateWords, randomQuote, buildTarget, generateNumbers, generatePunctuation } from './content'

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

describe('generateNumbers', () => {
  const seeded = () => {
    let i = 0
    return () => ((i++ % 9) + 1) / 10 // 0.1..0.9, deterministic
  }

  it('returns the requested number of space-separated groups', () => {
    expect(generateNumbers(12, seeded()).split(' ')).toHaveLength(12)
  })
  it('contains only digits and spaces', () => {
    expect(generateNumbers(30, seeded())).toMatch(/^[0-9 ]+$/)
  })
  it('is deterministic under a seeded rng', () => {
    expect(generateNumbers(10, seeded())).toBe(generateNumbers(10, seeded()))
  })
})

describe('generatePunctuation', () => {
  const seeded = () => {
    let i = 0
    return () => ((i++ % 9) + 1) / 10
  }

  it('contains commas and a terminal period', () => {
    const out = generatePunctuation(40, seeded())
    expect(out).toContain(',')
    expect(out).toContain('.')
  })
  it('starts with a capital letter', () => {
    expect(generatePunctuation(40, seeded())).toMatch(/^[A-Z]/)
  })
  it('is deterministic under a seeded rng', () => {
    expect(generatePunctuation(40, seeded())).toBe(generatePunctuation(40, seeded()))
  })
})

describe('buildTarget modes', () => {
  it('numbers mode generates a long digit stream', () => {
    const out = buildTarget('numbers', 60, () => 0.5)
    expect(out.length).toBeGreaterThan(200)
    expect(out).toMatch(/^[0-9 ]+$/)
  })
  it('punctuation mode generates a passage with punctuation', () => {
    const out = buildTarget('punctuation', 60, () => 0.5)
    expect(out).toContain('.')
    expect(out).toContain(',')
  })
})
