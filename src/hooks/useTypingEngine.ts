import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createEngine, applyKey } from '../engine/keystroke'
import { computeMetrics, type Metrics } from '../engine/metrics'
import { buildTarget } from '../engine/content'
import type { EngineState, Mode, Duration } from '../engine/types'

export type TestConfig = { mode: Mode; durationSeconds: Duration }

export function useTypingEngine(config: TestConfig) {
  const [state, setState] = useState<EngineState>(() =>
    createEngine(buildTarget(config.mode, config.durationSeconds)),
  )
  const [secondsLeft, setSecondsLeft] = useState<number>(config.durationSeconds)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

  const stopTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const restart = useCallback(() => {
    stopTimer()
    setState(createEngine(buildTarget(config.mode, config.durationSeconds)))
    setSecondsLeft(config.durationSeconds)
  }, [config.mode, config.durationSeconds, stopTimer])

  // Rebuild when config changes.
  useEffect(() => {
    restart()
  }, [restart])

  const startTimerIfNeeded = useCallback(() => {
    if (intervalRef.current !== null) return
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          stopTimer()
          setState((st) => (st.status === 'finished' ? st : applyKey(st, { type: 'finish' })))
          return 0
        }
        return s - 1
      })
    }, 1000)
  }, [stopTimer])

  const onChar = useCallback((char: string) => {
    setState((st) => {
      if (st.status === 'finished') return st
      if (st.status === 'idle') startTimerIfNeeded()
      return applyKey(st, { type: 'char', char, now: now() })
    })
  }, [startTimerIfNeeded])

  const onBackspace = useCallback(() => {
    setState((st) => applyKey(st, { type: 'backspace', now: now() }))
  }, [])

  // If the target is completed before time runs out, stop the timer.
  useEffect(() => {
    if (state.status === 'finished') stopTimer()
  }, [state.status, stopTimer])

  useEffect(() => stopTimer, [stopTimer])

  const elapsedSeconds = config.durationSeconds - secondsLeft
  const metrics: Metrics | null = useMemo(
    () => (state.status === 'finished'
      ? computeMetrics(state, Math.max(1, elapsedSeconds || config.durationSeconds))
      : null),
    [state, elapsedSeconds, config.durationSeconds],
  )

  return { state, secondsLeft, onChar, onBackspace, restart, metrics, elapsedSeconds }
}
