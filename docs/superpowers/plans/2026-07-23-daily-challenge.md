# TypePilot Daily Challenge + Streak Goal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a daily practice goal ("complete 3 tests today") with progress and the practice streak, shown on the test screen — derived entirely from existing `localStorage` history.

**Architecture:** Extract a shared `practiceStreak` helper from the dashboard stats, add a pure `computeDailyChallenge(sessions, todayKey)`, and render a compact `DailyChallengeCard` on the test view when a test isn't running. No new persistence, no backend.

**Tech Stack:** Existing Vite + React + TS + Vitest. No new dependencies.

## Global Constraints

- No new persistence or backend — derive everything from the existing `TypingSession[]` history.
- "Today" is a `YYYY-MM-DD` UTC key passed into the pure function (deterministic tests).
- The `stats.ts` change is a DRY refactor only — existing dashboard stat values must not change.
- The card renders on the test view **only when `engine.state.status !== 'running'`**.
- TypeScript strict. Commit after each task.
- Git note: if `git` fails with an Xcode-license error, prefix commands with `DEVELOPER_DIR=/Library/Developer/CommandLineTools`.

## File Structure

```
src/dashboard/stats.ts        + export practiceStreak(sessions); computeDashboardStats reuses it
src/dashboard/stats.test.ts   (extended: direct practiceStreak assertions)
src/challenge/daily.ts        computeDailyChallenge(sessions, todayKey): DailyChallenge  (pure)
src/challenge/daily.test.ts
src/components/
  DailyChallengeCard.tsx       compact goal-progress + streak banner
  DailyChallengeCard.test.tsx
src/App.tsx                    (modified: render the card on the test view)
src/App.test.tsx               (modified: card-visible assertion)
```

---

### Task 1: Shared streak helper + daily challenge module

**Files:**
- Modify: `src/dashboard/stats.ts`, `src/dashboard/stats.test.ts`
- Create: `src/challenge/daily.ts`, `src/challenge/daily.test.ts`

**Interfaces:**
- Consumes: `TypingSession` from `../storage/history`.
- Produces:
  - `practiceStreak(sessions: TypingSession[]): number` (exported from `stats.ts`)
  - `DAILY_GOAL_TESTS` constant, `DailyChallenge` type, `computeDailyChallenge(sessions, todayKey): DailyChallenge` (in `daily.ts`)

- [ ] **Step 1: Refactor `src/dashboard/stats.ts` to export `practiceStreak`**

Replace the existing `computeStreak` function:
```ts
function computeStreak(dayKeys: Set<string>, lastKey: string): number {
  let streak = 0
  const cursor = new Date(lastKey + 'T00:00:00Z')
  while (dayKeys.has(cursor.toISOString().slice(0, 10))) {
    streak++
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return streak
}
```
with an exported, self-contained version:
```ts
export function practiceStreak(sessions: TypingSession[]): number {
  if (sessions.length === 0) return 0
  const dayKeys = new Set(sessions.map((s) => dayKey(s.completedAt)))
  const lastIso = sessions.reduce((max, s) => (s.completedAt > max ? s.completedAt : max), sessions[0].completedAt)
  let streak = 0
  const cursor = new Date(dayKey(lastIso) + 'T00:00:00Z')
  while (dayKeys.has(cursor.toISOString().slice(0, 10))) {
    streak++
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return streak
}
```
Then in `computeDashboardStats`, replace the two streak lines:
```ts
  const dayKeys = new Set(ordered.map((s) => dayKey(s.completedAt)))
  const streakDays = computeStreak(dayKeys, dayKey(ordered[ordered.length - 1].completedAt))
```
with:
```ts
  const streakDays = practiceStreak(ordered)
```
(`dayKey` stays; it's now used by `practiceStreak`.)

- [ ] **Step 2: Add direct `practiceStreak` assertions to `src/dashboard/stats.test.ts`**

Update the import line:
```ts
import { computeDashboardStats, practiceStreak } from './stats'
```
Append this block to the end of the file:
```ts
describe('practiceStreak', () => {
  it('is 0 for empty history', () => {
    expect(practiceStreak([])).toBe(0)
  })
  it('counts consecutive days regardless of input order', () => {
    const s = [
      session({ completedAt: '2026-07-23T08:00:00.000Z' }),
      session({ completedAt: '2026-07-21T10:00:00.000Z' }),
      session({ completedAt: '2026-07-22T09:00:00.000Z' }),
    ]
    expect(practiceStreak(s)).toBe(3)
  })
})
```

- [ ] **Step 3: Run stats tests to verify they pass (refactor is behavior-preserving)**

Run: `npx vitest run src/dashboard/stats.test.ts`
Expected: PASS (existing dashboard tests unchanged in value + the two new `practiceStreak` cases).

- [ ] **Step 4: Write the failing test `src/challenge/daily.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { computeDailyChallenge, DAILY_GOAL_TESTS } from './daily'
import type { TypingSession } from '../storage/history'

function session(overrides: Partial<TypingSession>): TypingSession {
  return {
    id: Math.random().toString(), mode: 'words', durationSeconds: 60,
    grossWpm: 60, netWpm: 55, accuracy: 95, consistency: 80,
    correctCharacters: 100, incorrectCharacters: 5, backspaceCount: 2,
    completedAt: '2026-07-23T10:00:00.000Z', timeline: [], mistypedLetters: {},
    ...overrides,
  }
}

const TODAY = '2026-07-23'

describe('computeDailyChallenge', () => {
  it('reports an empty day for no history', () => {
    const c = computeDailyChallenge([], TODAY)
    expect(c).toMatchObject({ goalTests: DAILY_GOAL_TESTS, completedToday: 0, done: false, bestAccuracyToday: null, streakDays: 0 })
  })

  it('counts only today\'s sessions and tracks best accuracy today', () => {
    const c = computeDailyChallenge([
      session({ accuracy: 91, completedAt: '2026-07-23T09:00:00.000Z' }),
      session({ accuracy: 97, completedAt: '2026-07-23T11:00:00.000Z' }),
      session({ accuracy: 99, completedAt: '2026-07-22T11:00:00.000Z' }), // yesterday
    ], TODAY)
    expect(c.completedToday).toBe(2)
    expect(c.bestAccuracyToday).toBe(97)
    expect(c.done).toBe(false)
  })

  it('is done once the goal number of tests is reached today', () => {
    const c = computeDailyChallenge([
      session({ completedAt: '2026-07-23T08:00:00.000Z' }),
      session({ completedAt: '2026-07-23T09:00:00.000Z' }),
      session({ completedAt: '2026-07-23T10:00:00.000Z' }),
    ], TODAY)
    expect(c.completedToday).toBe(3)
    expect(c.done).toBe(true)
  })

  it('includes the practice streak', () => {
    const c = computeDailyChallenge([
      session({ completedAt: '2026-07-22T10:00:00.000Z' }),
      session({ completedAt: '2026-07-23T10:00:00.000Z' }),
    ], TODAY)
    expect(c.streakDays).toBe(2)
  })
})
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npx vitest run src/challenge/daily.test.ts`
Expected: FAIL — `daily.ts` missing.

- [ ] **Step 6: Create `src/challenge/daily.ts`**

```ts
import type { TypingSession } from '../storage/history'
import { practiceStreak } from '../dashboard/stats'

export const DAILY_GOAL_TESTS = 3

export type DailyChallenge = {
  goalTests: number
  completedToday: number
  done: boolean
  bestAccuracyToday: number | null
  streakDays: number
}

export function computeDailyChallenge(sessions: TypingSession[], todayKey: string): DailyChallenge {
  const todays = sessions.filter((s) => s.completedAt.slice(0, 10) === todayKey)
  const completedToday = todays.length
  const bestAccuracyToday = todays.length ? Math.max(...todays.map((s) => s.accuracy)) : null
  return {
    goalTests: DAILY_GOAL_TESTS,
    completedToday,
    done: completedToday >= DAILY_GOAL_TESTS,
    bestAccuracyToday,
    streakDays: practiceStreak(sessions),
  }
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run src/challenge/daily.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 8: Commit**

```bash
git add src/dashboard/stats.ts src/dashboard/stats.test.ts src/challenge/daily.ts src/challenge/daily.test.ts
git commit -m "feat: shared practiceStreak helper and daily challenge module"
```

---

### Task 2: Daily challenge card + test-screen wiring

**Files:**
- Create: `src/components/DailyChallengeCard.tsx`, `src/components/DailyChallengeCard.test.tsx`
- Modify: `src/App.tsx`, `src/App.test.tsx`

**Interfaces:**
- Consumes: `computeDailyChallenge` from `../challenge/daily`; `TypingSession` from `../storage/history`.
- Produces: `DailyChallengeCard({ sessions, today }: { sessions: TypingSession[]; today: string })`.

- [ ] **Step 1: Write the failing test `src/components/DailyChallengeCard.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DailyChallengeCard } from './DailyChallengeCard'
import type { TypingSession } from '../storage/history'

function session(completedAt: string): TypingSession {
  return {
    id: completedAt, mode: 'words', durationSeconds: 60,
    grossWpm: 60, netWpm: 55, accuracy: 95, consistency: 80,
    correctCharacters: 100, incorrectCharacters: 5, backspaceCount: 2,
    completedAt, timeline: [], mistypedLetters: {},
  }
}

const TODAY = '2026-07-23'

describe('DailyChallengeCard', () => {
  it('shows in-progress goal text and the streak', () => {
    render(<DailyChallengeCard sessions={[session('2026-07-23T09:00:00.000Z')]} today={TODAY} />)
    expect(screen.getByText(/daily goal/i)).toBeInTheDocument()
    expect(screen.getByText(/1 \/ 3 tests/i)).toBeInTheDocument()
    expect(screen.getByText(/🔥/)).toBeInTheDocument()
  })

  it('shows a done state once the goal is met', () => {
    render(
      <DailyChallengeCard
        sessions={[
          session('2026-07-23T08:00:00.000Z'),
          session('2026-07-23T09:00:00.000Z'),
          session('2026-07-23T10:00:00.000Z'),
        ]}
        today={TODAY}
      />,
    )
    expect(screen.getByText(/done/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/DailyChallengeCard.test.tsx`
Expected: FAIL — component missing.

- [ ] **Step 3: Create `src/components/DailyChallengeCard.tsx`**

```tsx
import { computeDailyChallenge } from '../challenge/daily'
import type { TypingSession } from '../storage/history'

type Props = {
  sessions: TypingSession[]
  today: string
}

export function DailyChallengeCard({ sessions, today }: Props) {
  const c = computeDailyChallenge(sessions, today)
  const pct = Math.min(100, Math.round((c.completedToday / c.goalTests) * 100))

  return (
    <div className="flex items-center gap-4 rounded-lg bg-surface px-4 py-3">
      <span className="text-sm text-muted">Daily goal</span>
      <div className="h-2 flex-1 rounded-full bg-muted/30">
        <div className="h-2 rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-sm tabular-nums">
        {c.done ? '✓ done' : `${c.completedToday} / ${c.goalTests} tests`}
      </span>
      <span className="font-mono text-sm text-accent-soft">🔥 {c.streakDays}d</span>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/DailyChallengeCard.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Add a card-visible assertion to `src/App.test.tsx`**

Add inside the existing `describe('App', ...)` block:
```tsx
it('shows the daily goal on the test screen', () => {
  render(<App />)
  expect(screen.getByText(/daily goal/i)).toBeInTheDocument()
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL — the card isn't rendered yet.

- [ ] **Step 7: Wire the card into `src/App.tsx`**

Add the import:
```tsx
import { DailyChallengeCard } from './components/DailyChallengeCard'
```
Compute today's key near the top of the component body (after the `useState` calls):
```tsx
  const today = new Date().toISOString().slice(0, 10)
```
In the test-view JSX, render the card between the `</header>` and the `<LiveMetrics ... />`, shown only when a test isn't running:
```tsx
      </header>

      {engine.state.status !== 'running' && (
        <DailyChallengeCard sessions={sessions} today={today} />
      )}

      <LiveMetrics
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS (all App tests, including the new one).

- [ ] **Step 9: Full suite + build**

Run: `npm test && npm run build`
Expected: all tests pass; the build succeeds with no TypeScript errors.

- [ ] **Step 10: Commit**

```bash
git add src/components/DailyChallengeCard.tsx src/components/DailyChallengeCard.test.tsx src/App.tsx src/App.test.tsx
git commit -m "feat: daily challenge card on the test screen"
```

---

## Self-Review Notes

- **Spec coverage:** shared `practiceStreak` extraction (T1), pure `computeDailyChallenge` with goal/completedToday/done/bestAccuracyToday/streak (T1), `DailyChallengeCard` progress + done + streak (T2), test-screen placement hidden while running (T2), tests for the module, card, and App visibility (T1/T2). ✅
- **Deferred (spec §8):** rotating/AI challenges, goal customization, notifications, dashboard placement.
- **Behavior-preserving refactor:** `computeDashboardStats` now calls `practiceStreak`, which reproduces the previous streak values (same UTC-day walk from the most recent test); existing stats tests remain the guard.
- **Type consistency:** `practiceStreak` exported from `stats.ts` and imported by `daily.ts`; `DailyChallenge`/`DAILY_GOAL_TESTS` defined once in `daily.ts` and consumed by `DailyChallengeCard`; App passes `sessions: TypingSession[]` and `today: string` matching the card's props.
