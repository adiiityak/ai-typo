import { describe, it, expect } from 'vitest'
import { generatePassage } from './passage'
import type { CoachInput } from './summary'

const base: CoachInput = {
  netWpm: 55, grossWpm: 58, accuracy: 95, consistency: 80,
  weakLetters: [], slowestWords: [], backspaceCount: 3, recentAverageWpm: 0,
  mode: 'words', durationSeconds: 60,
}

describe('generatePassage', () => {
  it('returns the alphabetic focus letters (top 3)', () => {
    const { focus } = generatePassage({ ...base, weakLetters: ['r', 't', 'e', 'a'] })
    expect(focus).toEqual(['r', 't', 'e'])
  })

  it('prefers words containing a focus letter', () => {
    const { passage } = generatePassage({ ...base, weakLetters: ['r'] })
    const words = passage.split(/\s+/)
    const withR = words.filter((w) => w.toLowerCase().includes('r')).length
    expect(withR / words.length).toBeGreaterThan(0.5)
  })

  it('produces a passage of roughly the target length', () => {
    const { passage } = generatePassage({ ...base, weakLetters: ['r', 't'] }, 45)
    const count = passage.split(/\s+/).length
    expect(count).toBeGreaterThanOrEqual(40)
    expect(count).toBeLessThanOrEqual(70)
  })

  it('injects punctuation when a weak letter is punctuation', () => {
    const { passage } = generatePassage({ ...base, weakLetters: [',', '.'] })
    expect(passage).toContain(',')
    expect(passage).toContain('.')
  })

  it('is deterministic for identical input', () => {
    const a = generatePassage({ ...base, weakLetters: ['t'] }).passage
    const b = generatePassage({ ...base, weakLetters: ['t'] }).passage
    expect(a).toBe(b)
  })
})
