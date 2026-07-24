# TypePilot Numbers & Punctuation Modes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Numbers and Punctuation test modes — deterministic content generators plus config-bar options — reusing the entire existing engine/results/dashboard/coach pipeline unchanged.

**Architecture:** Widen the `Mode` union and add two generators (`generateNumbers`, `generatePunctuation`) behind a `buildTarget` switch in `src/engine/content.ts`; add the two modes to `ConfigBar`. Everything downstream already types over `Mode` and handles an arbitrary target string, so no other logic changes.

**Tech Stack:** Existing Vite + React + TS + Vitest. No new dependencies.

## Global Constraints

- Generators are **deterministic and seedable** — an `rng: () => number` parameter defaulting to `Math.random`, matching the existing `generateWords`.
- Numbers output matches `/^[0-9 ]+$/`; punctuation output contains real punctuation (`,` and a terminal `.` at minimum).
- No changes to the engine, metrics, results, dashboard, or coach — they are mode-agnostic and must stay green.
- TypeScript strict. Commit after each task.

## File Structure

```
src/engine/
  types.ts        Mode widened to include 'numbers' | 'punctuation'
  content.ts      + generateNumbers, generatePunctuation; buildTarget becomes a switch
  content.test.ts (extended)
src/components/
  ConfigBar.tsx   MODES list gains 'numbers' and 'punctuation'
  ConfigBar.test.tsx (new)
```

---

### Task 1: Mode type + content generators

**Files:**
- Modify: `src/engine/types.ts`, `src/engine/content.ts`
- Test: `src/engine/content.test.ts` (extend)

**Interfaces:**
- Consumes: existing `WORDS`, `pickIndex`, `generateWords`, `randomQuote` in `content.ts`; `Mode`, `Duration` from `./types`.
- Produces:
  - `Mode = 'words' | 'quotes' | 'numbers' | 'punctuation'`
  - `generateNumbers(count: number, rng?: () => number): string`
  - `generatePunctuation(wordCount: number, rng?: () => number): string`
  - `buildTarget(mode: Mode, duration: Duration, rng?: () => number): string` (switch over all four modes)

- [ ] **Step 1: Widen the `Mode` type in `src/engine/types.ts`**

Replace the first line:
```ts
export type Mode = 'words' | 'quotes'
```
with:
```ts
export type Mode = 'words' | 'quotes' | 'numbers' | 'punctuation'
```

- [ ] **Step 2: Add failing tests to `src/engine/content.test.ts`**

Append these blocks to the end of the file (a seeded rng factory keeps them deterministic):
```ts
describe('generateNumbers', () => {
  const seeded = () => {
    let i = 0
    return () => ((i++ % 9) + 1) / 10 // 0.1..0.9, deterministic
  }

  it('returns the requested number of space-separated groups', () => {
    expect(generateNumbers(12, seeded()).split(' ')).toHaveLength(12)
  })
  it('contains only digits and spaces', () => {
    expect(generateNumbers(30, seeded())).toMatch(/^[0-9 ]+$/)
  })
  it('is deterministic under a seeded rng', () => {
    expect(generateNumbers(10, seeded())).toBe(generateNumbers(10, seeded()))
  })
})

describe('generatePunctuation', () => {
  const seeded = () => {
    let i = 0
    return () => ((i++ % 9) + 1) / 10
  }

  it('contains commas and a terminal period', () => {
    const out = generatePunctuation(40, seeded())
    expect(out).toContain(',')
    expect(out).toContain('.')
  })
  it('starts with a capital letter', () => {
    expect(generatePunctuation(40, seeded())).toMatch(/^[A-Z]/)
  })
  it('is deterministic under a seeded rng', () => {
    expect(generatePunctuation(40, seeded())).toBe(generatePunctuation(40, seeded()))
  })
})

describe('buildTarget modes', () => {
  it('numbers mode generates a long digit stream', () => {
    const out = buildTarget('numbers', 60, () => 0.5)
    expect(out.length).toBeGreaterThan(200)
    expect(out).toMatch(/^[0-9 ]+$/)
  })
  it('punctuation mode generates a passage with punctuation', () => {
    const out = buildTarget('punctuation', 60, () => 0.5)
    expect(out).toContain('.')
    expect(out).toContain(',')
  })
})
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run src/engine/content.test.ts`
Expected: FAIL — `generateNumbers` / `generatePunctuation` are not exported.

- [ ] **Step 4: Add the generators and switch to `src/engine/content.ts`**

Add these two functions after the existing `randomQuote` function:
```ts
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
```
Then replace the existing `buildTarget` function with a switch:
```ts
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
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/engine/content.test.ts`
Expected: PASS (existing tests plus the new blocks).

- [ ] **Step 6: Commit**

```bash
git add src/engine/types.ts src/engine/content.ts src/engine/content.test.ts
git commit -m "feat: numbers and punctuation content generators"
```

---

### Task 2: Config bar modes

**Files:**
- Modify: `src/components/ConfigBar.tsx`
- Test: `src/components/ConfigBar.test.tsx` (new)

**Interfaces:**
- Consumes: `Mode` (now four values) from `../engine/types`; the existing `ConfigBar` props `{ mode, duration, onChange, disabled? }`.
- Produces: a config bar rendering four mode pills; clicking one calls `onChange({ mode, duration })`.

- [ ] **Step 1: Write the failing test `src/components/ConfigBar.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfigBar } from './ConfigBar'

describe('ConfigBar', () => {
  it('renders all four mode pills', () => {
    render(<ConfigBar mode="words" duration={30} onChange={() => {}} />)
    for (const m of ['words', 'quotes', 'numbers', 'punctuation']) {
      expect(screen.getByRole('button', { name: new RegExp(`^${m}$`, 'i') })).toBeInTheDocument()
    }
  })

  it('fires onChange with the selected mode', async () => {
    const onChange = vi.fn()
    render(<ConfigBar mode="words" duration={30} onChange={onChange} />)
    await userEvent.setup().click(screen.getByRole('button', { name: /^numbers$/i }))
    expect(onChange).toHaveBeenCalledWith({ mode: 'numbers', duration: 30 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ConfigBar.test.tsx`
Expected: FAIL — only `words` and `quotes` pills render, so `getByRole` for `numbers` throws.

- [ ] **Step 3: Add the modes in `src/components/ConfigBar.tsx`**

Replace the `MODES` constant line:
```ts
const MODES: Mode[] = ['words', 'quotes']
```
with:
```ts
const MODES: Mode[] = ['words', 'quotes', 'numbers', 'punctuation']
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ConfigBar.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Full suite + build**

Run: `npm test && npm run build`
Expected: all tests pass; the build succeeds with no TypeScript errors (confirms the `Mode` widening ripples cleanly through `TypingSession`, `CoachInput`, `ConfigBar`, and `App`).

- [ ] **Step 6: Commit**

```bash
git add src/components/ConfigBar.tsx src/components/ConfigBar.test.tsx
git commit -m "feat: numbers and punctuation config-bar modes"
```

---

## Self-Review Notes

- **Spec coverage:** `Mode` widening (T1), `generateNumbers`/`generatePunctuation`/`buildTarget` switch (T1), config-bar modes (T2), tests for both generators + buildTarget + config bar (T1/T2), full-suite/build gate confirming no downstream breakage (T2). ✅
- **Deferred (spec §7):** Code mode, Custom Text, per-mode difficulty, mode-specific results.
- **Determinism:** both generators take a seeded `rng`; tests use a fixed 0.1–0.9 cycle. `generatePunctuation` forces the final sentence's terminator to `.` so a terminal period is always present, and inserts a comma in any sentence ≥4 words (guaranteed for the tested lengths).
- **Type consistency:** `Mode` defined once in `types.ts`; `content.ts` `buildTarget` switch covers all four values with a `words` default; `ConfigBar` `MODES: Mode[]` uses the same literals; `onChange` payload shape `{ mode, duration }` matches the existing `App` handler.
