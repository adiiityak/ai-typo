import type { EngineState, KeyAction } from './types'

export function createEngine(target: string): EngineState {
  return {
    status: 'idle',
    target,
    cursor: 0,
    events: [],
    progressTimes: [0],
    backspaceCount: 0,
    startedAt: null,
  }
}

export function applyKey(state: EngineState, action: KeyAction): EngineState {
  if (state.status === 'finished') return state

  switch (action.type) {
    case 'char': {
      const startedAt = state.startedAt ?? action.now
      const timestamp = action.now - startedAt
      const expected = state.target[state.cursor] ?? ''
      const event = {
        expected,
        typed: action.char,
        timestamp,
        isCorrect: action.char === expected,
        corrected: false,
      }
      const cursor = state.cursor + 1
      const progressTimes = state.progressTimes.slice()
      progressTimes[cursor] = timestamp
      const finished = cursor >= state.target.length
      return {
        ...state,
        status: finished ? 'finished' : 'running',
        startedAt,
        cursor,
        events: [...state.events, event],
        progressTimes,
      }
    }

    case 'backspace': {
      if (state.cursor === 0) return state
      const events = state.events.slice()
      const lastIdx = events.length - 1
      if (lastIdx >= 0) events[lastIdx] = { ...events[lastIdx], corrected: true }
      return {
        ...state,
        cursor: state.cursor - 1,
        backspaceCount: state.backspaceCount + 1,
        events,
      }
    }

    case 'finish':
      return { ...state, status: 'finished' }
  }
}
