export type Mode = 'words' | 'quotes' | 'numbers' | 'punctuation'
export type Duration = 30 | 60

export type CharacterEvent = {
  expected: string
  typed: string
  timestamp: number   // ms since first keystroke
  isCorrect: boolean
  corrected: boolean  // true once backspaced over
}

export type EngineStatus = 'idle' | 'running' | 'finished'

export type EngineState = {
  status: EngineStatus
  target: string
  cursor: number
  events: CharacterEvent[]
  progressTimes: number[]   // progressTimes[i] = ms when cursor advanced to index i
  backspaceCount: number
  startedAt: number | null  // ms epoch of first keystroke
}

export type KeyAction =
  | { type: 'char'; char: string; now: number }
  | { type: 'backspace'; now: number }
  | { type: 'finish' }
