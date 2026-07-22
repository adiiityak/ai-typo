import type { CoachInput } from './summary'

// Words chosen for broad letter coverage (all lowercase ASCII).
const BANK = [
  'return', 'structure', 'operator', 'character', 'pattern', 'partner', 'quarter',
  'matter', 'better', 'letter', 'writer', 'router', 'interest', 'strategy', 'trigger',
  'portrait', 'translate', 'tolerate', 'tractor', 'literature', 'reference', 'integrate',
  'literate', 'terrific', 'territory', 'architect', 'remainder', 'transfer', 'trainer',
  'torrent', 'rotate', 'retract', 'starter', 'printer', 'trimester', 'arbiter', 'reactor',
  'contrast', 'creature', 'earnest', 'greater', 'nature', 'picture', 'restore',
]

const FILLER = ['the', 'and', 'to', 'of', 'in', 'that', 'with', 'for', 'on', 'as']

function toSentences(words: string[]): string {
  const out = words.map((w, idx) => {
    let token = idx % 10 === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w
    if ((idx + 1) % 10 === 0) token += '.'
    else if ((idx + 1) % 5 === 0) token += ','
    return token
  })
  let sentence = out.join(' ')
  if (!sentence.endsWith('.')) sentence += '.'
  return sentence
}

export function generatePassage(
  input: CoachInput,
  targetWords = 45,
): { passage: string; focus: string[] } {
  const focus = input.weakLetters
    .filter((l) => /[a-z]/i.test(l))
    .map((l) => l.toLowerCase())
    .slice(0, 3)

  const preferred = focus.length
    ? BANK.filter((w) => focus.some((f) => w.includes(f)))
    : BANK
  const pool = preferred.length >= 5 ? preferred : BANK

  const words: string[] = []
  let i = 0
  while (words.length < targetWords) {
    words.push(pool[i % pool.length])
    if (words.length % 3 === 0 && words.length < targetWords) {
      words.push(FILLER[i % FILLER.length])
    }
    i++
  }

  const punctuationWeak = input.weakLetters.some(
    (c) => c.length === 1 && c !== ' ' && !/[a-z0-9]/i.test(c),
  )
  const passage = punctuationWeak ? toSentences(words) : words.join(' ')
  return { passage, focus }
}
