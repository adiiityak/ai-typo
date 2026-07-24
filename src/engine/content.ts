import type { Mode, Duration } from './types'

const WORDS = [
  'the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 'but',
  'his', 'from', 'they', 'say', 'her', 'she', 'will', 'one', 'all', 'would',
  'there', 'their', 'what', 'out', 'about', 'who', 'get', 'which', 'when', 'make',
  'can', 'like', 'time', 'just', 'him', 'know', 'take', 'people', 'into', 'year',
  'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now',
  'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use',
  'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want',
  'because', 'any', 'these', 'give', 'day', 'most', 'thing', 'many', 'where', 'much',
  'before', 'move', 'right', 'through', 'here', 'life', 'child', 'world', 'still', 'hand',
  'part', 'place', 'made', 'live', 'small', 'great', 'find', 'again', 'never', 'under',
]

const QUOTES = [
  'The quick brown fox jumps over the lazy dog while the sun sets slowly.',
  'Practice does not make perfect, but practice with focus makes progress.',
  'A journey of a thousand miles begins with a single confident step.',
  'The best way to predict the future is to build it one line at a time.',
  'Simplicity is the ultimate sophistication in both design and in life.',
  'Every expert was once a beginner who refused to give up too early.',
]

function pickIndex(rng: () => number, length: number): number {
  return Math.min(length - 1, Math.max(0, Math.floor(rng() * length)))
}

export function generateWords(count: number, rng: () => number = Math.random): string {
  const out: string[] = []
  for (let i = 0; i < count; i++) out.push(WORDS[pickIndex(rng, WORDS.length)])
  return out.join(' ')
}

export function randomQuote(pick: (n: number) => number = (n) => Math.floor(Math.random() * n)): string {
  const idx = Math.min(QUOTES.length - 1, Math.max(0, pick(QUOTES.length)))
  return QUOTES[idx]
}

export function generateNumbers(count: number, rng: () => number = Math.random): string {
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    const len = 1 + Math.floor(rng() * 4) // 1-4 digits
    let group = ''
    for (let j = 0; j < len; j++) group += Math.floor(rng() * 10)
    out.push(group)
  }
  return out.join(' ')
}

const ENDERS = ['.', '.', '.', '?', '!'] // weighted toward periods

export function generatePunctuation(wordCount: number, rng: () => number = Math.random): string {
  const sentences: string[] = []
  let produced = 0
  while (produced < wordCount) {
    const remaining = wordCount - produced
    const len = Math.min(remaining, 5 + Math.floor(rng() * 5)) // 5-9 words
    const words: string[] = []
    for (let i = 0; i < len; i++) words.push(WORDS[pickIndex(rng, WORDS.length)])
    words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1)
    if (len >= 4) {
      const commaAt = 1 + Math.floor(rng() * (len - 2))
      words[commaAt] = words[commaAt] + ','
    }
    produced += len
    const isLast = produced >= wordCount
    const ender = isLast ? '.' : ENDERS[pickIndex(rng, ENDERS.length)]
    sentences.push(words.join(' ') + ender)
  }
  return sentences.join(' ')
}

export function buildTarget(mode: Mode, duration: Duration, rng: () => number = Math.random): string {
  const streamCount = Math.ceil(duration * 3) + 20
  switch (mode) {
    case 'quotes':
      return randomQuote((n) => pickIndex(rng, n))
    case 'numbers':
      return generateNumbers(streamCount, rng)
    case 'punctuation':
      return generatePunctuation(streamCount, rng)
    case 'words':
    default:
      return generateWords(streamCount, rng)
  }
}
