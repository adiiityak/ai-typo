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

  it('restart returns to idle with a fresh target and full time', () => {
    const { result } = renderHook(() => useTypingEngine({ mode: 'quotes', durationSeconds: 30 }))
    act(() => result.current.onChar('T'))
    act(() => result.current.restart())
    expect(result.current.state.status).toBe('idle')
    expect(result.current.secondsLeft).toBe(30)
    expect(result.current.state.events).toHaveLength(0)
  })
})
