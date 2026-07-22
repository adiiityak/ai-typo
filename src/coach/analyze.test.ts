import { describe, it, expect } from 'vitest'
import { analyze } from './analyze'
import type { CoachInput } from './summary'

const base: CoachInput = {
  netWpm: 55, grossWpm: 58, accuracy: 95, consistency: 80,
  weakLetters: [], slowestWords: [], backspaceCount: 3, recentAverageWpm: 0,
  mode: 'words', durationSeconds: 60,
}

describe('analyze', () => {
  it('praises excellent accuracy', () => {
    const a = analyze({ ...base, accuracy: 98 })
    expect(a.strength).toMatch(/accuracy/i)
    expect(a.strength).toContain('98')
  })

  it('flags low accuracy with an accuracy warm-up', () => {
    const a = analyze({ ...base, accuracy: 85 })
    expect(a.weakness).toMatch(/accuracy/i)
    expect(a.exerciseType).toBe('accuracy_warmup')
  })

  it('detects punctuation weakness', () => {
    const a = analyze({ ...base, accuracy: 94, weakLetters: ['.', ','] })
    expect(a.weakness).toMatch(/punctuation/i)
    expect(a.exerciseType).toBe('punctuation_accuracy')
  })

  it('names weak letters for a letter drill', () => {
    const a = analyze({ ...base, accuracy: 95, weakLetters: ['r', 't', 'e'] })
    expect(a.weakness).toContain('r, t, e')
    expect(a.exerciseType).toBe('weak_letter_drill')
  })

  it('recognizes improvement over the recent average', () => {
    const a = analyze({ ...base, accuracy: 95, netWpm: 70, recentAverageWpm: 60 })
    expect(a.strength).toMatch(/faster than your recent average/i)
  })

  it('gives a speed challenge on a clean run', () => {
    const a = analyze({ ...base, accuracy: 100, consistency: 90, weakLetters: [], backspaceCount: 0 })
    expect(a.exerciseType).toBe('speed')
    expect(a.weakness).toMatch(/no major weak spots/i)
  })
})
