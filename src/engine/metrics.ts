import type { EngineState, CharacterEvent } from './types'

export type Metrics = {
  grossWpm: number
  netWpm: number
  accuracy: number
  consistency: number
  correctCharacters: number
  incorrectCharacters: number
  backspaceCount: number
  mistypedLetters: Record<string, number>
  slowestWords: { word: string; seconds: number }[]
  timeline: number[]
}

function round(n: number, dp = 1): number {
  const f = 10 ** dp
  return Math.round(n * f) / f
}

export function computeMetrics(state: EngineState, elapsedSeconds: number): Metrics {
  const events = state.events
  const total = events.length
  const correct = events.filter((e) => e.isCorrect).length
  const incorrect = total - correct
  const minutes = elapsedSeconds / 60

  const grossWpm = minutes > 0 ? round(total / 5 / minutes) : 0
  const errorsPerMin = minutes > 0 ? incorrect / minutes : 0
  const netWpm = minutes > 0 ? round(Math.max(0, grossWpm - errorsPerMin)) : 0
  const accuracy = total > 0 ? round((correct / total) * 100) : 0

  const mistypedLetters: Record<string, number> = {}
  for (const e of events) {
    if (!e.isCorrect && e.expected !== '' && e.expected !== ' ') {
      mistypedLetters[e.expected] = (mistypedLetters[e.expected] ?? 0) + 1
    }
  }

  const timeline = buildTimeline(events, elapsedSeconds)
  const consistency = buildConsistency(events, elapsedSeconds)
  const slowestWords = buildSlowestWords(state)

  return {
    grossWpm,
    netWpm,
    accuracy,
    consistency,
    correctCharacters: correct,
    incorrectCharacters: incorrect,
    backspaceCount: state.backspaceCount,
    mistypedLetters,
    slowestWords,
    timeline,
  }
}

function buildTimeline(events: CharacterEvent[], elapsedSeconds: number): number[] {
  const secs = Math.max(1, Math.ceil(elapsedSeconds))
  const timeline: number[] = []
  for (let s = 1; s <= secs; s++) {
    const upTo = events.filter((e) => e.timestamp < s * 1000).length
    const wpm = upTo / 5 / (s / 60)
    timeline.push(round(wpm))
  }
  return timeline
}

function buildConsistency(events: CharacterEvent[], elapsedSeconds: number): number {
  const secs = Math.max(1, Math.ceil(elapsedSeconds))
  const perSecond: number[] = new Array(secs).fill(0)
  for (const e of events) {
    const bucket = Math.min(secs - 1, Math.floor(e.timestamp / 1000))
    perSecond[bucket] += 1
  }
  const wpmSamples = perSecond.map((chars) => chars * 12) // chars/5 / (1/60)
  const mean = wpmSamples.reduce((a, b) => a + b, 0) / wpmSamples.length
  if (mean === 0) return 0
  const variance =
    wpmSamples.reduce((a, b) => a + (b - mean) ** 2, 0) / wpmSamples.length
  const cv = Math.sqrt(variance) / mean
  return round(Math.max(0, Math.min(100, 100 - cv * 100)))
}

function buildSlowestWords(state: EngineState): { word: string; seconds: number }[] {
  const words: { word: string; seconds: number }[] = []
  const target = state.target
  let start = 0
  for (let i = 0; i <= target.length; i++) {
    if (i === target.length || target[i] === ' ') {
      const word = target.slice(start, i)
      const startMs = state.progressTimes[start]
      const endMs = state.progressTimes[i]
      if (word && startMs !== undefined && endMs !== undefined) {
        words.push({ word, seconds: round((endMs - startMs) / 1000, 2) })
      }
      start = i + 1
    }
  }
  return words.sort((a, b) => b.seconds - a.seconds).slice(0, 3)
}
