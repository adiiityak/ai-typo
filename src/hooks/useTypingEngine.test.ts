import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useTypingEngine } from './useTypingEngine'

describe('useTypingEngine', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('starts idle with full time and no metrics', () => {
    const { result } = renderHook(() => useTypingEngine({ mode: 'quotes', durationSeconds: 30 }))
    expect(result.current.state.status).toBe('idle')
    expect(result.current.secondsLeft).toBe(30)
    expect(result.current.metrics).toBeNull()
  })

  it('counts down after the first keystroke and finishes at zero', () => {
    const { result } = renderHook(() => useTypingEngine({ mode: 'quotes', durationSeconds: 30 }))
    act(() => result.current.onChar('T'))
    expect(result.current.state.status).toBe('running')
    act(() => vi.advanceTimersByTime(30_000))
    expect(result.current.state.status).toBe('finished')
    expect(result.current.secondsLeft).toBe(0)
    expect(result.current.metrics).not.toBeNull()
  })

  it('uses actual typing time (not the full duration) when the target is finished early', () => {
    const { result } = renderHook(() => useTypingEngine({ mode: 'quotes', durationSeconds: 60 }))
    const target = result.current.state.target
    // Type the whole quote fast enough that no 1s tick fires (secondsLeft stays 60).
    act(() => {
      target.split('').forEach((ch) => {
        result.current.onChar(ch)
        vi.advanceTimersByTime(5)
      })
    })
    expect(result.current.state.status).toBe('finished')
    expect(result.current.secondsLeft).toBe(60) // finished before the first tick
    // With the old tick-based elapsed this would collapse to ~ (len/5)/1min (tens of wpm);
    // using the real sub-second typing time it must be far higher.
    expect(result.current.metrics!.grossWpm).toBeGreaterThan(60)
  })

  it('repeat (keepTarget) reuses the same passage; a fresh restart replaces it', () => {
    const { result } = renderHook(() => useTypingEngine({ mode: 'quotes', durationSeconds: 30 }))
    const first = result.current.state.target
    act(() => result.current.restart(true))
    expect(result.current.state.target).toBe(first)
  })

  it('restart returns to idle with a fresh target and full time', () => {
    const { result } = renderHook(() => useTypingEngine({ mode: 'quotes', durationSeconds: 30 }))
    act(() => result.current.onChar('T'))
    act(() => result.current.restart())
    expect(result.current.state.status).toBe('idle')
    expect(result.current.secondsLeft).toBe(30)
    expect(result.current.state.events).toHaveLength(0)
  })
})
