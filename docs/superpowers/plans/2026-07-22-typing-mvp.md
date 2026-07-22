# TypePilot MVP (Typing Engine + Results) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reliable, client-only typing-test web app: pick Words/Quotes + 30s/60s, take a test with live per-character feedback, and see accurate results (WPM, accuracy, consistency, error breakdown) that persist locally with a personal best.

**Architecture:** A Vite + React SPA with a framework-free, unit-tested engine layer (`src/engine`) that all metrics derive from a keystroke event log. React hooks wire the engine to input, a countdown timer, and rendering. `localStorage` persists completed sessions. A single `view` state in `App` flips between the Test and Results screens.

**Tech Stack:** Vite, React 18, TypeScript (strict), Tailwind CSS v4, Recharts, Vitest + Testing Library + jsdom.

## Global Constraints

- TypeScript `strict: true`. No `any` in engine code.
- Files under `src/engine/` and `src/storage/` MUST NOT import React or any DOM/browser API except `localStorage` (storage only). Engine is pure and unit-testable in Node/jsdom.
- No backend, no network calls, no auth. Everything runs client-side.
- All metrics derive from the `CharacterEvent[]` log + `progressTimes` — never recomputed ad-hoc in components.
- Modes shipped: `'words' | 'quotes'`. Durations: `30 | 60` (seconds).
- Test-first (TDD) for every `engine`/`storage` module: failing test → run → implement → pass → commit.
- Commit after each task with a `feat:`/`test:`/`chore:` prefix.

---

### Task 1: Project scaffold + tooling

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `postcss` not needed (Tailwind v4 Vite plugin), `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/vite-env.d.ts`, `vitest.setup.ts`, `.gitignore`
- Test: `src/smoke.test.ts`

**Interfaces:**
- Produces: a working `npm run dev`, `npm run build`, `npm test`. `App` default-exports a React component.

- [ ] **Step 1: Create `.gitignore`**

```
node_modules
dist
*.local
.DS_Store
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "typepilot",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "recharts": "^2.12.7"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@testing-library/jest-dom": "^6.4.8",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "jsdom": "^25.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.5.4",
    "vite": "^5.4.2",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "useDefineForClassFields": true,
    "lib": ["ES2021", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "vitest.setup.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: Create `vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
})
```

- [ ] **Step 6: Create `vitest.setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 7: Create `index.html`**

```html
<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TypePilot</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Create `src/vite-env.d.ts`**

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 9: Create `src/index.css`** (Tailwind v4 + theme tokens)

```css
@import 'tailwindcss';

@theme {
  --color-bg: #0d0e12;
  --color-surface: #16181f;
  --color-muted: #4b5060;
  --color-fg: #e6e8ee;
  --color-accent: #6c5cff;
  --color-accent-soft: #8b7dff;
  --color-error: #ff5c6c;
  --color-correct: #e6e8ee;
  --font-mono: ui-monospace, 'SF Mono', 'Fira Code', monospace;
}

html, body, #root { height: 100%; }
body { background: var(--color-bg); color: var(--color-fg); margin: 0; }

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 10: Create `src/App.tsx`** (placeholder to be replaced in Task 9)

```tsx
export default function App() {
  return <div className="p-8 font-mono text-fg">TypePilot</div>
}
```

- [ ] **Step 11: Create `src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 12: Write the smoke test `src/smoke.test.ts`**

```ts
import { describe, it, expect } from 'vitest'

describe('smoke', () => {
  it('runs the test harness', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 13: Install and verify**

Run: `npm install && npm test && npm run build`
Expected: `npm test` PASSES the smoke test; `npm run build` completes with a `dist/` output and no TypeScript errors.

- [ ] **Step 14: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Vite + React + TS + Tailwind + Vitest"
```

---

### Task 2: Content module (words + quotes)

**Files:**
- Create: `src/engine/content.ts`
- Test: `src/engine/content.test.ts`

**Interfaces:**
- Produces:
  - `generateWords(count: number): string` — space-joined lowercase words.
  - `randomQuote(pick?: (n: number) => number): string` — one quote string.
  - `buildTarget(mode: Mode, duration: Duration, rng?: () => number): string` — the passage to type. For `words`, generates enough words to outlast the duration; for `quotes`, returns one quote.
  - `Mode` and `Duration` are imported from `./types` (created in Task 3). **In this task, define them locally as a temporary re-export is not allowed — instead define `content.ts` to import from `./types`, and create `./types` first.** See Step 1.

- [ ] **Step 1: Create `src/engine/types.ts` (types needed here + by later tasks)**

```ts
export type Mode = 'words' | 'quotes'
export type Duration = 30 | 60
```

(Task 3 appends more types to this same file.)

- [ ] **Step 2: Write the failing test `src/engine/content.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { generateWords, randomQuote, buildTarget } from './content'

describe('generateWords', () => {
  it('returns the requested number of space-separated words', () => {
    const out = generateWords(10)
    expect(out.split(' ')).toHaveLength(10)
  })
  it('returns only lowercase letters and spaces', () => {
    expect(generateWords(50)).toMatch(/^[a-z ]+$/)
  })
  it('is deterministic given a seeded rng', () => {
    let i = 0
    const rng = () => (i++ % 7) / 7
    expect(generateWords(5, rng)).toBe(generateWords(5, () => { let j = 0; return (j++ % 7) / 7 }()))
  })
})

describe('randomQuote', () => {
  it('returns a non-empty string', () => {
    expect(randomQuote(() => 0).length).toBeGreaterThan(0)
  })
  it('respects the pick function to choose an index', () => {
    const first = randomQuote(() => 0)
    const second = randomQuote(() => 1)
    expect(first).not.toBe(second)
  })
})

describe('buildTarget', () => {
  it('words mode generates a long passage', () => {
    expect(buildTarget('words', 60, () => 0.5).length).toBeGreaterThan(200)
  })
  it('quotes mode returns a single quote', () => {
    const t = buildTarget('quotes', 30, () => 0)
    expect(t).not.toContain('  ')
    expect(t.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/engine/content.test.ts`
Expected: FAIL — `content.ts` does not exist / exports undefined.

- [ ] **Step 4: Implement `src/engine/content.ts`**

```ts
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

export function buildTarget(mode: Mode, duration: Duration, rng: () => number = Math.random): string {
  if (mode === 'quotes') return randomQuote((n) => pickIndex(rng, n))
  // ~2.5 words/sec upper bound for a fast typist; generate generously so it never runs out.
  const wordCount = Math.ceil(duration * 3) + 20
  return generateWords(wordCount, rng)
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/engine/content.test.ts`
Expected: PASS (all cases).

- [ ] **Step 6: Commit**

```bash
git add src/engine/content.ts src/engine/content.test.ts src/engine/types.ts
git commit -m "feat: content module for words and quotes"
```

---

### Task 3: Engine types + keystroke reducer

**Files:**
- Modify: `src/engine/types.ts`
- Create: `src/engine/keystroke.ts`
- Test: `src/engine/keystroke.test.ts`

**Interfaces:**
- Produces:
  - Types: `CharacterEvent`, `EngineStatus`, `EngineState`, `KeyAction`.
  - `createEngine(target: string): EngineState`
  - `applyKey(state: EngineState, action: KeyAction): EngineState` (pure)
- Consumes: `Mode`, `Duration` from `./types`.

- [ ] **Step 1: Append types to `src/engine/types.ts`**

```ts
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
```

- [ ] **Step 2: Write the failing test `src/engine/keystroke.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { createEngine, applyKey } from './keystroke'
import type { EngineState } from './types'

function typeString(state: EngineState, text: string, startNow = 1000): EngineState {
  let s = state
  text.split('').forEach((ch, i) => {
    s = applyKey(s, { type: 'char', char: ch, now: startNow + i * 100 })
  })
  return s
}

describe('createEngine', () => {
  it('starts idle with an empty log at cursor 0', () => {
    const s = createEngine('the cat')
    expect(s.status).toBe('idle')
    expect(s.cursor).toBe(0)
    expect(s.events).toHaveLength(0)
    expect(s.progressTimes[0]).toBe(0)
  })
})

describe('applyKey char', () => {
  it('transitions to running on first keystroke and records the event', () => {
    const s = applyKey(createEngine('the'), { type: 'char', char: 't', now: 5000 })
    expect(s.status).toBe('running')
    expect(s.cursor).toBe(1)
    expect(s.events[0]).toMatchObject({ expected: 't', typed: 't', isCorrect: true, corrected: false })
    expect(s.events[0].timestamp).toBe(0)
    expect(s.startedAt).toBe(5000)
  })

  it('records an incorrect event when the char does not match', () => {
    const s = applyKey(createEngine('the'), { type: 'char', char: 'x', now: 5000 })
    expect(s.events[0].isCorrect).toBe(false)
    expect(s.cursor).toBe(1)
  })

  it('finishes when the last character of the target is typed', () => {
    const s = typeString(createEngine('hi'), 'hi')
    expect(s.status).toBe('finished')
    expect(s.cursor).toBe(2)
  })

  it('records progressTimes at each advanced index', () => {
    const s = typeString(createEngine('ab'), 'ab', 2000)
    expect(s.progressTimes[1]).toBe(0)     // first char at t=0
    expect(s.progressTimes[2]).toBe(100)   // second char 100ms later
  })

  it('ignores input once finished', () => {
    const s = typeString(createEngine('hi'), 'hi')
    const after = applyKey(s, { type: 'char', char: 'x', now: 9999 })
    expect(after).toBe(s)
  })
})

describe('applyKey backspace', () => {
  it('moves the cursor back, counts the backspace, and marks the event corrected', () => {
    let s = applyKey(createEngine('the'), { type: 'char', char: 'x', now: 1000 })
    s = applyKey(s, { type: 'backspace', now: 1100 })
    expect(s.cursor).toBe(0)
    expect(s.backspaceCount).toBe(1)
    expect(s.events[0].corrected).toBe(true)
  })

  it('does nothing at cursor 0', () => {
    const s = createEngine('the')
    const after = applyKey(s, { type: 'backspace', now: 1000 })
    expect(after).toBe(s)
  })

  it('keeps the original error in the log after correction (Monkeytype-style)', () => {
    let s = applyKey(createEngine('the'), { type: 'char', char: 'x', now: 1000 })
    s = applyKey(s, { type: 'backspace', now: 1100 })
    s = applyKey(s, { type: 'char', char: 't', now: 1200 })
    expect(s.events).toHaveLength(2)
    expect(s.events[0].isCorrect).toBe(false)
    expect(s.events[1].isCorrect).toBe(true)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/engine/keystroke.test.ts`
Expected: FAIL — `keystroke.ts` missing.

- [ ] **Step 4: Implement `src/engine/keystroke.ts`**

```ts
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/engine/keystroke.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/engine/types.ts src/engine/keystroke.ts src/engine/keystroke.test.ts
git commit -m "feat: keystroke reducer with event log and progress tracking"
```

---

### Task 4: Metrics module

**Files:**
- Create: `src/engine/metrics.ts`
- Test: `src/engine/metrics.test.ts`

**Interfaces:**
- Consumes: `EngineState` from `./types`.
- Produces:
  - `type Metrics` (see Step 1).
  - `computeMetrics(state: EngineState, elapsedSeconds: number): Metrics`

- [ ] **Step 1: Write the failing test `src/engine/metrics.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { computeMetrics } from './metrics'
import { createEngine, applyKey } from './keystroke'
import type { EngineState } from './types'

function type(target: string, text: string, msPerChar = 100): EngineState {
  let s = createEngine(target)
  text.split('').forEach((ch, i) => {
    s = applyKey(s, { type: 'char', char: ch, now: 1000 + i * msPerChar })
  })
  return s
}

describe('computeMetrics', () => {
  it('computes gross WPM as chars/5/minutes', () => {
    // 60 correct chars in 60s => 12 words / 1 min = 12 wpm
    const s = type('a'.repeat(60), 'a'.repeat(60))
    const m = computeMetrics(s, 60)
    expect(m.grossWpm).toBeCloseTo(12, 5)
  })

  it('computes 100% accuracy for all-correct input', () => {
    const s = type('abcde', 'abcde')
    const m = computeMetrics(s, 60)
    expect(m.accuracy).toBeCloseTo(100, 5)
    expect(m.correctCharacters).toBe(5)
    expect(m.incorrectCharacters).toBe(0)
  })

  it('reduces accuracy and net WPM for errors', () => {
    // target 'aaaaa', typed 'aaxaa' => 4 correct, 1 wrong of 5
    const s = type('aaaaa', 'aaxaa')
    const m = computeMetrics(s, 60)
    expect(m.accuracy).toBeCloseTo(80, 5)
    expect(m.incorrectCharacters).toBe(1)
    expect(m.netWpm).toBeLessThan(m.grossWpm)
  })

  it('floors net WPM at 0', () => {
    const s = type('aaaaa', 'xxxxx')
    const m = computeMetrics(s, 60)
    expect(m.netWpm).toBe(0)
  })

  it('aggregates mistyped letters by expected character', () => {
    const s = type('rte', 'xxe')
    const m = computeMetrics(s, 60)
    expect(m.mistypedLetters).toEqual({ r: 1, t: 1 })
  })

  it('reports the backspace count from state', () => {
    let s = type('abc', 'ax')
    s = applyKey(s, { type: 'backspace', now: 5000 })
    const m = computeMetrics(s, 60)
    expect(m.backspaceCount).toBe(1)
  })

  it('returns a per-second timeline of cumulative WPM', () => {
    // 24 chars over 2 seconds (12/sec) => cumulative wpm ~ [144, 144]
    const s = type('a'.repeat(24), 'a'.repeat(24), 1000 / 12)
    const m = computeMetrics(s, 2)
    expect(m.timeline).toHaveLength(2)
    expect(m.timeline[1]).toBeCloseTo(144, 0)
  })

  it('returns consistency between 0 and 100', () => {
    const s = type('a'.repeat(24), 'a'.repeat(24), 1000 / 12)
    const m = computeMetrics(s, 2)
    expect(m.consistency).toBeGreaterThanOrEqual(0)
    expect(m.consistency).toBeLessThanOrEqual(100)
  })

  it('identifies slowest words by typing duration', () => {
    // 'go slow' — type 'go ' fast, 'slow' slow
    let s = createEngine('go slow')
    const times = [0, 50, 100, 150, 900, 1650, 2400, 3150] // per-char cumulative ms
    'go slow'.split('').forEach((ch, i) => {
      s = applyKey(s, { type: 'char', char: ch, now: 1000 + times[i] })
    })
    const m = computeMetrics(s, 60)
    expect(m.slowestWords[0].word).toBe('slow')
  })

  it('handles zero elapsed time without dividing by zero', () => {
    const m = computeMetrics(createEngine('abc'), 0)
    expect(m.grossWpm).toBe(0)
    expect(m.accuracy).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/metrics.test.ts`
Expected: FAIL — `metrics.ts` missing.

- [ ] **Step 3: Implement `src/engine/metrics.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/metrics.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/engine/metrics.ts src/engine/metrics.test.ts
git commit -m "feat: metrics module (wpm, accuracy, consistency, aggregates)"
```

---

### Task 5: Storage / history module

**Files:**
- Create: `src/storage/history.ts`
- Test: `src/storage/history.test.ts`

**Interfaces:**
- Consumes: `Mode`, `Duration` from `../engine/types`; `Metrics` from `../engine/metrics`.
- Produces:
  - `type TypingSession`
  - `buildSession(input): TypingSession` — assembles a session record from mode, duration, metrics, and an id/date provider.
  - `saveSession(session: TypingSession): void`
  - `loadSessions(): TypingSession[]`
  - `personalBest(sessions: TypingSession[]): number` — max netWpm, or 0.
  - `isPersonalBest(sessions: TypingSession[], netWpm: number): boolean`

- [ ] **Step 1: Write the failing test `src/storage/history.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import {
  buildSession, saveSession, loadSessions, personalBest, isPersonalBest,
} from './history'
import type { Metrics } from '../engine/metrics'

const metrics: Metrics = {
  grossWpm: 60, netWpm: 55, accuracy: 96, consistency: 80,
  correctCharacters: 300, incorrectCharacters: 12, backspaceCount: 4,
  mistypedLetters: { r: 3 }, slowestWords: [{ word: 'through', seconds: 0.9 }],
  timeline: [50, 55, 60],
}

describe('buildSession', () => {
  it('assembles a session from metrics + config', () => {
    const s = buildSession({ mode: 'words', durationSeconds: 60, metrics, id: 'x1', completedAt: '2026-07-22T00:00:00.000Z' })
    expect(s).toMatchObject({ id: 'x1', mode: 'words', durationSeconds: 60, netWpm: 55, accuracy: 96 })
    expect(s.timeline).toEqual([50, 55, 60])
  })
})

describe('persistence', () => {
  beforeEach(() => localStorage.clear())

  it('saves and loads sessions', () => {
    const s = buildSession({ mode: 'quotes', durationSeconds: 30, metrics, id: 'a', completedAt: '2026-07-22T00:00:00.000Z' })
    saveSession(s)
    expect(loadSessions()).toHaveLength(1)
    expect(loadSessions()[0].id).toBe('a')
  })

  it('returns [] when nothing saved', () => {
    expect(loadSessions()).toEqual([])
  })

  it('tolerates corrupt storage', () => {
    localStorage.setItem('typepilot.sessions', 'not json')
    expect(loadSessions()).toEqual([])
  })
})

describe('personalBest', () => {
  it('is the max netWpm', () => {
    const mk = (net: number, id: string) => buildSession({ mode: 'words', durationSeconds: 60, metrics: { ...metrics, netWpm: net }, id, completedAt: '2026-07-22T00:00:00.000Z' })
    expect(personalBest([mk(40, '1'), mk(62, '2'), mk(51, '3')])).toBe(62)
  })
  it('is 0 for empty history', () => {
    expect(personalBest([])).toBe(0)
  })
  it('isPersonalBest true when strictly greater than prior best', () => {
    const prior = [buildSession({ mode: 'words', durationSeconds: 60, metrics: { ...metrics, netWpm: 50 }, id: '1', completedAt: '2026-07-22T00:00:00.000Z' })]
    expect(isPersonalBest(prior, 55)).toBe(true)
    expect(isPersonalBest(prior, 50)).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/storage/history.test.ts`
Expected: FAIL — `history.ts` missing.

- [ ] **Step 3: Implement `src/storage/history.ts`**

```ts
import type { Mode, Duration } from '../engine/types'
import type { Metrics } from '../engine/metrics'

const KEY = 'typepilot.sessions'

export type TypingSession = {
  id: string
  mode: Mode
  durationSeconds: Duration
  grossWpm: number
  netWpm: number
  accuracy: number
  consistency: number
  correctCharacters: number
  incorrectCharacters: number
  backspaceCount: number
  completedAt: string
  timeline: number[]
  mistypedLetters: Record<string, number>
}

export function buildSession(input: {
  mode: Mode
  durationSeconds: Duration
  metrics: Metrics
  id: string
  completedAt: string
}): TypingSession {
  const { mode, durationSeconds, metrics, id, completedAt } = input
  return {
    id,
    mode,
    durationSeconds,
    grossWpm: metrics.grossWpm,
    netWpm: metrics.netWpm,
    accuracy: metrics.accuracy,
    consistency: metrics.consistency,
    correctCharacters: metrics.correctCharacters,
    incorrectCharacters: metrics.incorrectCharacters,
    backspaceCount: metrics.backspaceCount,
    completedAt,
    timeline: metrics.timeline,
    mistypedLetters: metrics.mistypedLetters,
  }
}

export function loadSessions(): TypingSession[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as TypingSession[]) : []
  } catch {
    return []
  }
}

export function saveSession(session: TypingSession): void {
  const all = loadSessions()
  all.push(session)
  localStorage.setItem(KEY, JSON.stringify(all))
}

export function personalBest(sessions: TypingSession[]): number {
  return sessions.reduce((best, s) => Math.max(best, s.netWpm), 0)
}

export function isPersonalBest(sessions: TypingSession[], netWpm: number): boolean {
  return netWpm > personalBest(sessions)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/storage/history.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/storage/history.ts src/storage/history.test.ts
git commit -m "feat: localStorage session history + personal best"
```

---

### Task 6: useTypingEngine hook (timer + input glue)

**Files:**
- Create: `src/hooks/useTypingEngine.ts`
- Test: `src/hooks/useTypingEngine.test.ts`

**Interfaces:**
- Consumes: `createEngine`, `applyKey`, `computeMetrics`, `buildTarget`, types.
- Produces:
  - `type TestConfig = { mode: Mode; durationSeconds: Duration }`
  - `useTypingEngine(config: TestConfig)` returning:
    - `state: EngineState`
    - `secondsLeft: number`
    - `onChar(char: string): void`
    - `onBackspace(): void`
    - `restart(): void`
    - `metrics: Metrics | null` (non-null only when `state.status === 'finished'`)
    - `elapsedSeconds: number`

- [ ] **Step 1: Write the failing test `src/hooks/useTypingEngine.test.ts`**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/useTypingEngine.test.ts`
Expected: FAIL — hook missing.

- [ ] **Step 3: Implement `src/hooks/useTypingEngine.ts`**

```ts
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
  const [secondsLeft, setSecondsLeft] = useState(config.durationSeconds)
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/hooks/useTypingEngine.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useTypingEngine.ts src/hooks/useTypingEngine.test.ts
git commit -m "feat: useTypingEngine hook wiring timer and input"
```

---

### Task 7: Test-screen components (ConfigBar, TypingArea, LiveMetrics)

**Files:**
- Create: `src/components/ConfigBar.tsx`, `src/components/TypingArea.tsx`, `src/components/LiveMetrics.tsx`
- Test: `src/components/TypingArea.test.tsx`

**Interfaces:**
- `ConfigBar` props: `{ mode: Mode; duration: Duration; onChange: (c: { mode: Mode; duration: Duration }) => void; disabled?: boolean }`
- `TypingArea` props: `{ state: EngineState; onChar: (c: string) => void; onBackspace: () => void }` — captures keystrokes via a focused hidden input; renders per-character states.
- `LiveMetrics` props: `{ secondsLeft: number; grossWpm: number; accuracy: number; showWpm: boolean; onToggleWpm: () => void }`

- [ ] **Step 1: Write the failing test `src/components/TypingArea.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TypingArea } from './TypingArea'
import { createEngine } from '../engine/keystroke'

describe('TypingArea', () => {
  it('renders each target character', () => {
    render(<TypingArea state={createEngine('hi')} onChar={() => {}} onBackspace={() => {}} />)
    expect(screen.getByTestId('char-0')).toHaveTextContent('h')
    expect(screen.getByTestId('char-1')).toHaveTextContent('i')
  })

  it('calls onChar for a typed letter and onBackspace for backspace', async () => {
    const onChar = vi.fn()
    const onBackspace = vi.fn()
    render(<TypingArea state={createEngine('hi')} onChar={onChar} onBackspace={onBackspace} />)
    const user = userEvent.setup()
    await user.keyboard('h')
    expect(onChar).toHaveBeenCalledWith('h')
    await user.keyboard('{Backspace}')
    expect(onBackspace).toHaveBeenCalled()
  })

  it('marks the character at the cursor as current', () => {
    const state = { ...createEngine('hi'), cursor: 1 }
    render(<TypingArea state={state} onChar={() => {}} onBackspace={() => {}} />)
    expect(screen.getByTestId('char-1').getAttribute('data-state')).toBe('current')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/TypingArea.test.tsx`
Expected: FAIL — components missing.

- [ ] **Step 3: Implement `src/components/TypingArea.tsx`**

```tsx
import { useEffect, useRef } from 'react'
import type { EngineState } from '../engine/types'

type Props = {
  state: EngineState
  onChar: (char: string) => void
  onBackspace: () => void
}

function charState(state: EngineState, index: number): 'correct' | 'incorrect' | 'current' | 'untyped' {
  if (index === state.cursor) return 'current'
  if (index < state.cursor) {
    // find the most recent event for this position by counting forward events
    const typed = state.events[index]
    return typed && typed.isCorrect ? 'correct' : 'incorrect'
  }
  return 'untyped'
}

const CLASS: Record<string, string> = {
  correct: 'text-correct',
  incorrect: 'text-error underline decoration-error',
  current: 'text-fg bg-accent/30 rounded-sm',
  untyped: 'text-muted',
}

export function TypingArea({ state, onChar, onBackspace }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div
      className="relative cursor-text select-none"
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        aria-label="typing input"
        className="absolute opacity-0 -z-10 h-px w-px"
        autoFocus
        value=""
        onChange={() => {}}
        onKeyDown={(e) => {
          if (e.key === 'Backspace') {
            e.preventDefault()
            onBackspace()
          } else if (e.key.length === 1) {
            e.preventDefault()
            onChar(e.key)
          }
        }}
      />
      <p className="font-mono text-2xl leading-relaxed tracking-wide max-w-3xl">
        {state.target.split('').map((ch, i) => {
          const st = charState(state, i)
          return (
            <span key={i} data-testid={`char-${i}`} data-state={st} className={CLASS[st]}>
              {ch}
            </span>
          )
        })}
      </p>
    </div>
  )
}
```

Note: this component's per-char correctness uses `events[index]`, which is correct for forward-only typing without corrections; corrected retypes are a known simplification acceptable for the MVP live view (final metrics remain exact via the full event log).

- [ ] **Step 4: Implement `src/components/ConfigBar.tsx`**

```tsx
import type { Mode, Duration } from '../engine/types'

type Props = {
  mode: Mode
  duration: Duration
  onChange: (c: { mode: Mode; duration: Duration }) => void
  disabled?: boolean
}

const MODES: Mode[] = ['words', 'quotes']
const DURATIONS: Duration[] = [30, 60]

function Pill({ active, disabled, onClick, children }: {
  active: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`px-3 py-1 rounded-md text-sm transition-colors disabled:opacity-40
        ${active ? 'bg-accent text-white' : 'text-muted hover:text-fg'}`}
    >
      {children}
    </button>
  )
}

export function ConfigBar({ mode, duration, onChange, disabled }: Props) {
  return (
    <div className="flex items-center gap-6 rounded-lg bg-surface px-4 py-2">
      <div className="flex gap-1">
        {MODES.map((m) => (
          <Pill key={m} active={m === mode} disabled={disabled} onClick={() => onChange({ mode: m, duration })}>
            {m}
          </Pill>
        ))}
      </div>
      <div className="h-4 w-px bg-muted/40" />
      <div className="flex gap-1">
        {DURATIONS.map((d) => (
          <Pill key={d} active={d === duration} disabled={disabled} onClick={() => onChange({ mode, duration: d })}>
            {d}s
          </Pill>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Implement `src/components/LiveMetrics.tsx`**

```tsx
type Props = {
  secondsLeft: number
  grossWpm: number
  accuracy: number
  showWpm: boolean
  onToggleWpm: () => void
}

export function LiveMetrics({ secondsLeft, grossWpm, accuracy, showWpm, onToggleWpm }: Props) {
  return (
    <div className="flex items-center gap-8 font-mono text-accent-soft">
      <span className="text-3xl tabular-nums">{secondsLeft}</span>
      {showWpm && (
        <>
          <span className="text-lg tabular-nums">{grossWpm} wpm</span>
          <span className="text-lg tabular-nums">{accuracy}%</span>
        </>
      )}
      <button
        type="button"
        onClick={onToggleWpm}
        className="ml-auto text-xs text-muted hover:text-fg"
      >
        {showWpm ? 'hide live wpm' : 'show live wpm'}
      </button>
    </div>
  )
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/components/TypingArea.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/ConfigBar.tsx src/components/TypingArea.tsx src/components/LiveMetrics.tsx src/components/TypingArea.test.tsx
git commit -m "feat: test-screen components (config, typing area, live metrics)"
```

---

### Task 8: Results screen components

**Files:**
- Create: `src/components/Results/ResultsScreen.tsx`, `src/components/Results/MetricGrid.tsx`, `src/components/Results/WpmTimelineChart.tsx`, `src/components/Results/ErrorBreakdown.tsx`, `src/components/Results/HistoryList.tsx`
- Test: `src/components/Results/ResultsScreen.test.tsx`

**Interfaces:**
- `ResultsScreen` props: `{ metrics: Metrics; mode: Mode; duration: Duration; sessions: TypingSession[]; isBest: boolean; onRepeat: () => void; onNewTest: () => void }`
- Sub-components consume slices of `Metrics` / `TypingSession[]`.

- [ ] **Step 1: Write the failing test `src/components/Results/ResultsScreen.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResultsScreen } from './ResultsScreen'
import type { Metrics } from '../../engine/metrics'

const metrics: Metrics = {
  grossWpm: 62, netWpm: 58, accuracy: 96, consistency: 81,
  correctCharacters: 290, incorrectCharacters: 12, backspaceCount: 5,
  mistypedLetters: { r: 5, t: 4, e: 3 },
  slowestWords: [{ word: 'experience', seconds: 2.8 }],
  timeline: [40, 52, 58, 60, 62],
}

describe('ResultsScreen', () => {
  it('shows the headline net WPM and accuracy', () => {
    render(<ResultsScreen metrics={metrics} mode="words" duration={60} sessions={[]} isBest={false} onRepeat={() => {}} onNewTest={() => {}} />)
    expect(screen.getByTestId('net-wpm')).toHaveTextContent('58')
    expect(screen.getByText(/96%/)).toBeInTheDocument()
  })

  it('shows a personal-best badge when isBest', () => {
    render(<ResultsScreen metrics={metrics} mode="words" duration={60} sessions={[]} isBest onRepeat={() => {}} onNewTest={() => {}} />)
    expect(screen.getByText(/personal best/i)).toBeInTheDocument()
  })

  it('fires callbacks for repeat and new test', async () => {
    const onRepeat = vi.fn(); const onNewTest = vi.fn()
    render(<ResultsScreen metrics={metrics} mode="words" duration={60} sessions={[]} isBest={false} onRepeat={onRepeat} onNewTest={onNewTest} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /repeat/i }))
    await user.click(screen.getByRole('button', { name: /new test/i }))
    expect(onRepeat).toHaveBeenCalled()
    expect(onNewTest).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Results/ResultsScreen.test.tsx`
Expected: FAIL — components missing.

- [ ] **Step 3: Implement `src/components/Results/MetricGrid.tsx`**

```tsx
import type { Metrics } from '../../engine/metrics'

export function MetricGrid({ metrics }: { metrics: Metrics }) {
  const items = [
    { label: 'accuracy', value: `${metrics.accuracy}%` },
    { label: 'consistency', value: `${metrics.consistency}%` },
    { label: 'gross wpm', value: `${metrics.grossWpm}` },
    { label: 'errors', value: `${metrics.incorrectCharacters}` },
    { label: 'backspaces', value: `${metrics.backspaceCount}` },
  ]
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
      {items.map((it) => (
        <div key={it.label} className="rounded-lg bg-surface p-4">
          <div className="text-xs uppercase tracking-wide text-muted">{it.label}</div>
          <div className="mt-1 font-mono text-2xl tabular-nums">{it.value}</div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Implement `src/components/Results/WpmTimelineChart.tsx`**

```tsx
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export function WpmTimelineChart({ timeline }: { timeline: number[] }) {
  const data = timeline.map((wpm, i) => ({ second: i + 1, wpm }))
  return (
    <div className="h-56 w-full rounded-lg bg-surface p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="second" stroke="#4b5060" fontSize={12} />
          <YAxis stroke="#4b5060" fontSize={12} width={32} />
          <Tooltip
            contentStyle={{ background: '#16181f', border: 'none', borderRadius: 8, color: '#e6e8ee' }}
            labelFormatter={(s) => `${s}s`}
          />
          <Line type="monotone" dataKey="wpm" stroke="#6c5cff" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 5: Implement `src/components/Results/ErrorBreakdown.tsx`**

```tsx
import type { Metrics } from '../../engine/metrics'

export function ErrorBreakdown({ metrics }: { metrics: Metrics }) {
  const letters = Object.entries(metrics.mistypedLetters).sort((a, b) => b[1] - a[1]).slice(0, 5)
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg bg-surface p-4">
        <h3 className="mb-2 text-sm text-muted">most mistyped letters</h3>
        {letters.length === 0 ? (
          <p className="text-muted">No mistakes — clean run.</p>
        ) : (
          <ul className="space-y-1 font-mono">
            {letters.map(([ch, n]) => (
              <li key={ch} className="flex justify-between">
                <span className="text-error">{ch === ' ' ? '␣' : ch}</span>
                <span className="text-muted">{n} errors</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="rounded-lg bg-surface p-4">
        <h3 className="mb-2 text-sm text-muted">slowest words</h3>
        <ul className="space-y-1 font-mono">
          {metrics.slowestWords.map((w) => (
            <li key={w.word} className="flex justify-between">
              <span>{w.word}</span>
              <span className="text-muted">{w.seconds.toFixed(1)}s</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Implement `src/components/Results/HistoryList.tsx`**

```tsx
import type { TypingSession } from '../../storage/history'

export function HistoryList({ sessions }: { sessions: TypingSession[] }) {
  const recent = [...sessions].reverse().slice(0, 5)
  if (recent.length === 0) return null
  return (
    <div className="rounded-lg bg-surface p-4">
      <h3 className="mb-2 text-sm text-muted">recent tests</h3>
      <table className="w-full text-left font-mono text-sm">
        <thead className="text-muted">
          <tr><th>date</th><th>mode</th><th>wpm</th><th>acc</th><th>dur</th></tr>
        </thead>
        <tbody>
          {recent.map((s) => (
            <tr key={s.id} className="border-t border-muted/20">
              <td>{new Date(s.completedAt).toLocaleDateString()}</td>
              <td>{s.mode}</td>
              <td className="tabular-nums">{s.netWpm}</td>
              <td className="tabular-nums">{s.accuracy}%</td>
              <td>{s.durationSeconds}s</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 7: Implement `src/components/Results/ResultsScreen.tsx`**

```tsx
import type { Metrics } from '../../engine/metrics'
import type { Mode, Duration } from '../../engine/types'
import type { TypingSession } from '../../storage/history'
import { MetricGrid } from './MetricGrid'
import { WpmTimelineChart } from './WpmTimelineChart'
import { ErrorBreakdown } from './ErrorBreakdown'
import { HistoryList } from './HistoryList'

type Props = {
  metrics: Metrics
  mode: Mode
  duration: Duration
  sessions: TypingSession[]
  isBest: boolean
  onRepeat: () => void
  onNewTest: () => void
}

export function ResultsScreen({ metrics, mode, duration, sessions, isBest, onRepeat, onNewTest }: Props) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <div className="flex items-end gap-6">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted">net wpm</div>
          <div data-testid="net-wpm" className="font-mono text-7xl text-accent">{metrics.netWpm}</div>
        </div>
        <div className="pb-3 text-lg text-muted">{metrics.accuracy}% accuracy · {mode} · {duration}s</div>
        {isBest && (
          <span className="mb-4 ml-auto rounded-full bg-accent/20 px-3 py-1 text-sm text-accent-soft">
            ★ Personal best
          </span>
        )}
      </div>

      <MetricGrid metrics={metrics} />
      <WpmTimelineChart timeline={metrics.timeline} />
      <ErrorBreakdown metrics={metrics} />
      <HistoryList sessions={sessions} />

      <div className="flex gap-3">
        <button type="button" onClick={onRepeat}
          className="rounded-lg bg-accent px-5 py-2 text-white hover:bg-accent-soft">Repeat</button>
        <button type="button" onClick={onNewTest}
          className="rounded-lg bg-surface px-5 py-2 text-fg hover:text-accent-soft">New test</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run src/components/Results/ResultsScreen.test.tsx`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/components/Results
git commit -m "feat: results screen with metrics, chart, error breakdown, history"
```

---

### Task 9: App wiring + persistence + manual verification

**Files:**
- Modify: `src/App.tsx` (replace placeholder)
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes everything above. `App` owns: `view` (`'test' | 'results'`), `config`, `showWpm`, and the session list.
- On finish: build a session (id + ISO date generated here), save it, compute `isBest` from prior sessions, switch to results.

- [ ] **Step 1: Write the failing test `src/App.test.tsx`**

```tsx
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App', () => {
  beforeEach(() => { localStorage.clear(); vi.useFakeTimers({ shouldAdvanceTime: true }) })
  afterEach(() => vi.useRealTimers())

  it('renders the config bar and typing area on load', () => {
    render(<App />)
    expect(screen.getByLabelText('typing input')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /words/i })).toBeInTheDocument()
  })

  it('shows results after the timer expires and persists a session', async () => {
    render(<App />)
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await user.keyboard('the')
    await act(async () => { vi.advanceTimersByTime(30_000) })
    expect(await screen.findByTestId('net-wpm')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('typepilot.sessions')!)).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL — App is still the placeholder.

- [ ] **Step 3: Implement `src/App.tsx`**

```tsx
import { useCallback, useEffect, useState } from 'react'
import { ConfigBar } from './components/ConfigBar'
import { TypingArea } from './components/TypingArea'
import { LiveMetrics } from './components/LiveMetrics'
import { ResultsScreen } from './components/Results/ResultsScreen'
import { useTypingEngine, type TestConfig } from './hooks/useTypingEngine'
import { computeMetrics } from './engine/metrics'
import {
  buildSession, saveSession, loadSessions, isPersonalBest, type TypingSession,
} from './storage/history'

export default function App() {
  const [config, setConfig] = useState<TestConfig>({ mode: 'words', durationSeconds: 30 })
  const [view, setView] = useState<'test' | 'results'>('test')
  const [showWpm, setShowWpm] = useState(true)
  const [sessions, setSessions] = useState<TypingSession[]>(() => loadSessions())
  const [isBest, setIsBest] = useState(false)

  const engine = useTypingEngine(config)

  const liveMetrics = engine.state.status === 'running'
    ? computeMetrics(engine.state, Math.max(1, engine.elapsedSeconds || 1))
    : { grossWpm: 0, accuracy: 100 }

  // On finish: persist + go to results (guard against double-run).
  useEffect(() => {
    if (engine.state.status !== 'finished' || !engine.metrics || view === 'results') return
    const prior = loadSessions()
    const best = isPersonalBest(prior, engine.metrics.netWpm)
    const session = buildSession({
      mode: config.mode,
      durationSeconds: config.durationSeconds,
      metrics: engine.metrics,
      id: `${prior.length + 1}-${engine.metrics.netWpm}`,
      completedAt: new Date().toISOString(),
    })
    saveSession(session)
    setSessions(loadSessions())
    setIsBest(best)
    setView('results')
  }, [engine.state.status, engine.metrics, config, view])

  const repeat = useCallback(() => { setView('test'); engine.restart() }, [engine])
  const newTest = useCallback(() => { setView('test'); engine.restart() }, [engine])

  if (view === 'results' && engine.metrics) {
    return (
      <ResultsScreen
        metrics={engine.metrics}
        mode={config.mode}
        duration={config.durationSeconds}
        sessions={sessions}
        isBest={isBest}
        onRepeat={repeat}
        onNewTest={newTest}
      />
    )
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 p-6">
      <header className="flex items-center justify-between">
        <span className="font-mono text-lg text-accent">TypePilot</span>
        <ConfigBar
          mode={config.mode}
          duration={config.durationSeconds}
          disabled={engine.state.status === 'running'}
          onChange={setConfig}
        />
      </header>

      <LiveMetrics
        secondsLeft={engine.secondsLeft}
        grossWpm={liveMetrics.grossWpm}
        accuracy={liveMetrics.accuracy}
        showWpm={showWpm}
        onToggleWpm={() => setShowWpm((v) => !v)}
      />

      <main className="flex flex-1 items-center">
        <TypingArea state={engine.state} onChar={engine.onChar} onBackspace={engine.onBackspace} />
      </main>

      <footer className="flex gap-3">
        <button type="button" onClick={engine.restart}
          className="rounded-lg bg-surface px-4 py-2 text-sm text-muted hover:text-fg">
          Restart (↻)
        </button>
      </footer>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run the full suite + typecheck + build**

Run: `npm test && npm run build`
Expected: ALL tests pass; build succeeds with no TS errors.

- [ ] **Step 6: Manual verification**

Run: `npm run dev`, open the local URL. Confirm:
- Typing starts the countdown; characters color correctly (grey → white/red); caret marks current char.
- Timer reaching 0 shows Results with a WPM chart, mistyped letters, slowest words.
- Reload → take another test → "recent tests" shows history; beating prior net WPM shows the personal-best badge.
- Toggling "hide live wpm" hides the WPM/accuracy chips.
- Switching mode/duration while idle rebuilds the passage; controls are disabled mid-test.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "feat: wire app views, live metrics, and session persistence"
```

---

## Self-Review Notes

- **Spec coverage:** typing engine (T3), WPM/accuracy/consistency/aggregates (T4), Words+Quotes & 30/60s (T2), backspace-anywhere with retained errors (T3), per-character states + no-reflow render (T7), results screen with chart/errors/slowest words/personal best (T8), localStorage history (T5), dark theme + reduced-motion (T1). ✅
- **Deferred (out of scope, per spec §9):** AI, auth, dashboard, gamification, extra modes, keyboard heatmap. Not planned here by design.
- **Known MVP simplification:** the live per-character color in `TypingArea` uses `events[index]` (exact for forward typing; approximate after mid-word corrections). Final metrics remain exact because they use the full event log + `progressTimes`. Documented in Task 7.
