import { describe, it, expect } from 'vitest'
import { createEngine, applyKey } from './keystroke'
import type { EngineState } from './types'

function typeString(state: EngineState, text: string, startNow = 1000): EngineState {
  let s = state
  text.split('').forEach((ch, i) => {
    s = applyKey(s, { type: 'char', char: ch, now: startNow + i * 100 })
  })
  return s
}

describe('createEngine', () => {
  it('starts idle with an empty log at cursor 0', () => {
    const s = createEngine('the cat')
    expect(s.status).toBe('idle')
    expect(s.cursor).toBe(0)
    expect(s.events).toHaveLength(0)
    expect(s.progressTimes[0]).toBe(0)
  })
})

describe('applyKey char', () => {
  it('transitions to running on first keystroke and records the event', () => {
    const s = applyKey(createEngine('the'), { type: 'char', char: 't', now: 5000 })
    expect(s.status).toBe('running')
    expect(s.cursor).toBe(1)
    expect(s.events[0]).toMatchObject({ expected: 't', typed: 't', isCorrect: true, corrected: false })
    expect(s.events[0].timestamp).toBe(0)
    expect(s.startedAt).toBe(5000)
  })

  it('records an incorrect event when the char does not match', () => {
    const s = applyKey(createEngine('the'), { type: 'char', char: 'x', now: 5000 })
    expect(s.events[0].isCorrect).toBe(false)
    expect(s.cursor).toBe(1)
  })

  it('finishes when the last character of the target is typed', () => {
    const s = typeString(createEngine('hi'), 'hi')
    expect(s.status).toBe('finished')
    expect(s.cursor).toBe(2)
  })

  it('records progressTimes at each advanced index', () => {
    const s = typeString(createEngine('ab'), 'ab', 2000)
    expect(s.progressTimes[1]).toBe(0)     // first char at t=0
    expect(s.progressTimes[2]).toBe(100)   // second char 100ms later
  })

  it('ignores input once finished', () => {
    const s = typeString(createEngine('hi'), 'hi')
    const after = applyKey(s, { type: 'char', char: 'x', now: 9999 })
    expect(after).toBe(s)
  })
})

describe('applyKey backspace', () => {
  it('moves the cursor back, counts the backspace, and marks the event corrected', () => {
    let s = applyKey(createEngine('the'), { type: 'char', char: 'x', now: 1000 })
    s = applyKey(s, { type: 'backspace', now: 1100 })
    expect(s.cursor).toBe(0)
    expect(s.backspaceCount).toBe(1)
    expect(s.events[0].corrected).toBe(true)
  })

  it('does nothing at cursor 0', () => {
    const s = createEngine('the')
    const after = applyKey(s, { type: 'backspace', now: 1000 })
    expect(after).toBe(s)
  })

  it('keeps the original error in the log after correction (Monkeytype-style)', () => {
    let s = applyKey(createEngine('the'), { type: 'char', char: 'x', now: 1000 })
    s = applyKey(s, { type: 'backspace', now: 1100 })
    s = applyKey(s, { type: 'char', char: 't', now: 1200 })
    expect(s.events).toHaveLength(2)
    expect(s.events[0].isCorrect).toBe(false)
    expect(s.events[1].isCorrect).toBe(true)
  })
})
