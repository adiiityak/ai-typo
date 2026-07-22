import type { CoachInput, CoachAnalysis } from './summary'

type Kind = 'accuracy' | 'punctuation' | 'letters' | 'backspace' | 'consistency' | 'none'

function isPunctuation(ch: string): boolean {
  return ch.length === 1 && ch !== ' ' && !/[a-z0-9]/i.test(ch)
}

function alphaLetters(weakLetters: string[]): string[] {
  return weakLetters.filter((l) => /[a-z]/i.test(l))
}

function buildStrength(input: CoachInput): string {
  if (input.accuracy >= 97) return `Your accuracy is excellent at ${input.accuracy}%.`
  if (input.recentAverageWpm > 0 && input.netWpm >= input.recentAverageWpm + 3) {
    return `You're typing faster than your recent average (${input.netWpm} vs ${input.recentAverageWpm} WPM).`
  }
  if (input.consistency >= 85) return `Your pace was very steady (${input.consistency}% consistency).`
  if (input.netWpm >= 60) return `You maintained a strong speed of ${input.netWpm} WPM.`
  return 'You kept a solid, steady pace.'
}

function classifyWeakness(input: CoachInput): { kind: Kind; letters: string[] } {
  const letters = alphaLetters(input.weakLetters).slice(0, 3)
  if (input.accuracy < 90) return { kind: 'accuracy', letters }
  if (input.weakLetters.some(isPunctuation)) return { kind: 'punctuation', letters }
  if (letters.length > 0 && input.accuracy < 97) return { kind: 'letters', letters }
  if (input.backspaceCount >= 15) return { kind: 'backspace', letters }
  if (input.consistency < 60) return { kind: 'consistency', letters }
  return { kind: 'none', letters }
}

function weaknessText(input: CoachInput, kind: Kind, letters: string[]): string {
  switch (kind) {
    case 'accuracy': return `Your accuracy dipped to ${input.accuracy}% — worth slowing down slightly.`
    case 'punctuation': return 'Your accuracy drops around punctuation.'
    case 'letters': return `You mistyped the letters ${letters.join(', ')} most often.`
    case 'backspace': return `You used Backspace a lot (${input.backspaceCount} times), which breaks your rhythm.`
    case 'consistency': return `Your pace was inconsistent (${input.consistency}% consistency).`
    case 'none': return 'No major weak spots — keep pushing your speed.'
  }
}

function recommend(kind: Kind, letters: string[]): { recommendation: string; exerciseType: string } {
  switch (kind) {
    case 'accuracy': return { recommendation: 'Do a slow accuracy warm-up: type for two minutes without correcting.', exerciseType: 'accuracy_warmup' }
    case 'punctuation': return { recommendation: 'Practice a punctuation-heavy passage, focusing on commas and periods.', exerciseType: 'punctuation_accuracy' }
    case 'letters': return { recommendation: `Drill words rich in the letters ${letters.join(', ')}.`, exerciseType: 'weak_letter_drill' }
    case 'backspace': return { recommendation: 'Aim to finish words without correcting — accuracy first, speed later.', exerciseType: 'no_backspace' }
    case 'consistency': return { recommendation: 'Do a steady-pace sprint: hold an even rhythm for 30 seconds.', exerciseType: 'rhythm' }
    case 'none': return { recommendation: 'Push for a new personal best on your next run.', exerciseType: 'speed' }
  }
}

export function analyze(input: CoachInput): CoachAnalysis {
  const strength = buildStrength(input)
  const { kind, letters } = classifyWeakness(input)
  const weakness = weaknessText(input, kind, letters)
  const { recommendation, exerciseType } = recommend(kind, letters)
  return { strength, weakness, recommendation, exerciseType }
}
