# TypePilot Progress Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a progress dashboard — WPM/accuracy trend chart, headline stat cards (current/best WPM, avg accuracy, streak, total tests, time practiced), weak areas, and recent tests — computed entirely from the existing `localStorage` history, plus Test/Dashboard navigation.

**Architecture:** A pure, unit-tested `computeDashboardStats(sessions)` derives every number from `TypingSession[]`. A `Nav` component and a `DashboardScreen` (stat cards + Recharts trend chart + weak areas + recent tests) render it. `App` gains a `'dashboard'` view and wires navigation. No auth, no backend, no new dependencies.

**Tech Stack:** Existing Vite + React + TS + Vitest + Recharts. No new dependencies.

## Global Constraints

- **No new persistence, auth, or backend** — read only from the existing `localStorage` history via `TypingSession[]`.
- All dashboard numbers come from the pure `computeDashboardStats` function; components don't recompute stats ad-hoc.
- Day keys for the streak use the **UTC date** portion of the stored ISO `completedAt` (deterministic across timezones).
- `src/engine/` and `src/storage/` stay unchanged. `HistoryList` gains only a backward-compatible optional `limit` prop.
- TypeScript strict. Commit after each task.

## File Structure

```
src/dashboard/
  stats.ts       computeDashboardStats(sessions): DashboardStats  (pure)
  stats.test.ts
src/components/
  Nav.tsx        logo + Test/Dashboard tabs
  Nav.test.tsx
  Dashboard/
    DashboardScreen.tsx   layout + empty state
    StatCards.tsx
    TrendChart.tsx        Recharts WPM + accuracy lines
    WeakAreas.tsx
    DashboardScreen.test.tsx
  Results/HistoryList.tsx  (modified: optional `limit` prop, default 5)
src/App.tsx                (modified: 'dashboard' view + Nav)
src/App.test.tsx           (modified: navigation test)
```

---

### Task 1: Dashboard stats module

**Files:**
- Create: `src/dashboard/stats.ts`, `src/dashboard/stats.test.ts`

**Interfaces:**
- Consumes: `TypingSession` from `../storage/history`.
- Produces:
  - `type TrendPoint = { index: number; netWpm: number; accuracy: number }`
  - `type DashboardStats = { currentWpm; bestWpm; averageAccuracy; totalTests; totalSeconds; streakDays; weakLetters: { letter: string; count: number }[]; series: TrendPoint[] }`
  - `computeDashboardStats(sessions: TypingSession[]): DashboardStats`

- [ ] **Step 1: Write the failing test `src/dashboard/stats.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { computeDashboardStats } from './stats'
import type { TypingSession } from '../storage/history'

function session(overrides: Partial<TypingSession>): TypingSession {
  return {
    id: Math.random().toString(), mode: 'words', durationSeconds: 60,
    grossWpm: 60, netWpm: 55, accuracy: 95, consistency: 80,
    correctCharacters: 100, incorrectCharacters: 5, backspaceCount: 2,
    completedAt: '2026-07-20T10:00:00.000Z', timeline: [], mistypedLetters: {},
    ...overrides,
  }
}

describe('computeDashboardStats', () => {
  it('returns zeroed stats for empty history', () => {
    const s = computeDashboardStats([])
    expect(s).toMatchObject({ currentWpm: 0, bestWpm: 0, averageAccuracy: 0, totalTests: 0, totalSeconds: 0, streakDays: 0 })
    expect(s.weakLetters).toEqual([])
    expect(s.series).toEqual([])
  })

  it('computes current (newest), best, average accuracy, totals', () => {
    const s = computeDashboardStats([
      session({ netWpm: 40, accuracy: 90, durationSeconds: 30, completedAt: '2026-07-20T10:00:00.000Z' }),
      session({ netWpm: 62, accuracy: 96, durationSeconds: 60, completedAt: '2026-07-21T10:00:00.000Z' }),
      session({ netWpm: 51, accuracy: 100, durationSeconds: 60, completedAt: '2026-07-22T10:00:00.000Z' }),
    ])
    expect(s.currentWpm).toBe(51)     // newest by completedAt
    expect(s.bestWpm).toBe(62)
    expect(s.averageAccuracy).toBe(95) // (90+96+100)/3 = 95.33 -> 95
    expect(s.totalTests).toBe(3)
    expect(s.totalSeconds).toBe(150)
    expect(s.series.map((p) => p.netWpm)).toEqual([40, 62, 51]) // oldest -> newest
  })

  it('counts a consecutive-day streak ending at the most recent test', () => {
    const s = computeDashboardStats([
      session({ completedAt: '2026-07-21T10:00:00.000Z' }),
      session({ completedAt: '2026-07-22T09:00:00.000Z' }),
      session({ completedAt: '2026-07-23T08:00:00.000Z' }),
    ])
    expect(s.streakDays).toBe(3)
  })

  it('breaks the streak on a gap', () => {
    const s = computeDashboardStats([
      session({ completedAt: '2026-07-20T10:00:00.000Z' }),
      session({ completedAt: '2026-07-23T10:00:00.000Z' }), // gap on 21 & 22
    ])
    expect(s.streakDays).toBe(1)
  })

  it('treats a single day as a 1-day streak', () => {
    expect(computeDashboardStats([session({})]).streakDays).toBe(1)
  })

  it('aggregates weak letters across sessions, most-missed first', () => {
    const s = computeDashboardStats([
      session({ mistypedLetters: { r: 3, t: 1 } }),
      session({ mistypedLetters: { r: 2, e: 4 } }),
    ])
    expect(s.weakLetters).toEqual([
      { letter: 'e', count: 4 },
      { letter: 'r', count: 5 },
    ].sort((a, b) => b.count - a.count))
    expect(s.weakLetters[0]).toEqual({ letter: 'r', count: 5 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/dashboard/stats.test.ts`
Expected: FAIL — `stats.ts` missing.

- [ ] **Step 3: Create `src/dashboard/stats.ts`**

```ts
import type { TypingSession } from '../storage/history'

export type TrendPoint = { index: number; netWpm: number; accuracy: number }

export type DashboardStats = {
  currentWpm: number
  bestWpm: number
  averageAccuracy: number
  totalTests: number
  totalSeconds: number
  streakDays: number
  weakLetters: { letter: string; count: number }[]
  series: TrendPoint[]
}

function dayKey(iso: string): string {
  return iso.slice(0, 10) // YYYY-MM-DD (UTC date from the stored ISO string)
}

function computeStreak(dayKeys: Set<string>, lastKey: string): number {
  let streak = 0
  const cursor = new Date(lastKey + 'T00:00:00Z')
  while (dayKeys.has(cursor.toISOString().slice(0, 10))) {
    streak++
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return streak
}

export function computeDashboardStats(sessions: TypingSession[]): DashboardStats {
  if (sessions.length === 0) {
    return {
      currentWpm: 0, bestWpm: 0, averageAccuracy: 0, totalTests: 0,
      totalSeconds: 0, streakDays: 0, weakLetters: [], series: [],
    }
  }

  const ordered = [...sessions].sort((a, b) => a.completedAt.localeCompare(b.completedAt))

  const currentWpm = ordered[ordered.length - 1].netWpm
  const bestWpm = ordered.reduce((max, s) => Math.max(max, s.netWpm), 0)
  const averageAccuracy = Math.round(ordered.reduce((sum, s) => sum + s.accuracy, 0) / ordered.length)
  const totalTests = ordered.length
  const totalSeconds = ordered.reduce((sum, s) => sum + s.durationSeconds, 0)

  const dayKeys = new Set(ordered.map((s) => dayKey(s.completedAt)))
  const streakDays = computeStreak(dayKeys, dayKey(ordered[ordered.length - 1].completedAt))

  const agg: Record<string, number> = {}
  for (const s of ordered) {
    for (const [letter, count] of Object.entries(s.mistypedLetters)) {
      agg[letter] = (agg[letter] ?? 0) + count
    }
  }
  const weakLetters = Object.entries(agg)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([letter, count]) => ({ letter, count }))

  const series = ordered.map((s, i) => ({ index: i + 1, netWpm: s.netWpm, accuracy: s.accuracy }))

  return { currentWpm, bestWpm, averageAccuracy, totalTests, totalSeconds, streakDays, weakLetters, series }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/dashboard/stats.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/dashboard/stats.ts src/dashboard/stats.test.ts
git commit -m "feat: dashboard stats aggregation"
```

---

### Task 2: Navigation component

**Files:**
- Create: `src/components/Nav.tsx`, `src/components/Nav.test.tsx`

**Interfaces:**
- Produces: `type NavView = 'test' | 'dashboard'`; `Nav({ active, onNavigate }: { active: NavView; onNavigate: (v: NavView) => void })`.

- [ ] **Step 1: Write the failing test `src/components/Nav.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Nav } from './Nav'

describe('Nav', () => {
  it('renders both tabs and marks the active one', () => {
    render(<Nav active="dashboard" onNavigate={() => {}} />)
    expect(screen.getByRole('button', { name: /^test$/i })).toBeInTheDocument()
    const dash = screen.getByRole('button', { name: /^dashboard$/i })
    expect(dash).toHaveAttribute('aria-current', 'page')
  })

  it('calls onNavigate with the clicked view', async () => {
    const onNavigate = vi.fn()
    render(<Nav active="test" onNavigate={onNavigate} />)
    await userEvent.setup().click(screen.getByRole('button', { name: /^dashboard$/i }))
    expect(onNavigate).toHaveBeenCalledWith('dashboard')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Nav.test.tsx`
Expected: FAIL — `Nav.tsx` missing.

- [ ] **Step 3: Create `src/components/Nav.tsx`**

```tsx
export type NavView = 'test' | 'dashboard'

const TABS: NavView[] = ['test', 'dashboard']

type Props = {
  active: NavView
  onNavigate: (v: NavView) => void
}

export function Nav({ active, onNavigate }: Props) {
  return (
    <nav className="flex items-center justify-between">
      <span className="font-mono text-lg text-accent">TypePilot</span>
      <div className="flex gap-1">
        {TABS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onNavigate(v)}
            aria-current={active === v ? 'page' : undefined}
            className={`px-3 py-1 rounded-md text-sm capitalize transition-colors ${
              active === v ? 'bg-accent text-white' : 'text-muted hover:text-fg'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Nav.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/Nav.tsx src/components/Nav.test.tsx
git commit -m "feat: test/dashboard navigation component"
```

---

### Task 3: Dashboard screen + sub-components

**Files:**
- Create: `src/components/Dashboard/StatCards.tsx`, `src/components/Dashboard/TrendChart.tsx`, `src/components/Dashboard/WeakAreas.tsx`, `src/components/Dashboard/DashboardScreen.tsx`, `src/components/Dashboard/DashboardScreen.test.tsx`
- Modify: `src/components/Results/HistoryList.tsx` (add optional `limit` prop, default 5)

**Interfaces:**
- Consumes: `computeDashboardStats`, `DashboardStats`, `TrendPoint` (Task 1); `TypingSession` from `../../storage/history`; `HistoryList` from `../Results/HistoryList`.
- Produces: `DashboardScreen({ sessions, onStartTest }: { sessions: TypingSession[]; onStartTest: () => void })`.

- [ ] **Step 1: Write the failing test `src/components/Dashboard/DashboardScreen.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DashboardScreen } from './DashboardScreen'
import type { TypingSession } from '../../storage/history'

function session(overrides: Partial<TypingSession>): TypingSession {
  return {
    id: Math.random().toString(), mode: 'words', durationSeconds: 60,
    grossWpm: 60, netWpm: 55, accuracy: 95, consistency: 80,
    correctCharacters: 100, incorrectCharacters: 5, backspaceCount: 2,
    completedAt: '2026-07-22T10:00:00.000Z', timeline: [], mistypedLetters: {},
    ...overrides,
  }
}

describe('DashboardScreen', () => {
  it('shows the empty state and fires onStartTest when there is no history', async () => {
    const onStartTest = vi.fn()
    render(<DashboardScreen sessions={[]} onStartTest={onStartTest} />)
    expect(screen.getByText(/take your first test/i)).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: /start a test/i }))
    expect(onStartTest).toHaveBeenCalledOnce()
  })

  it('renders stat labels and a formatted time-practiced value from history', () => {
    render(
      <DashboardScreen
        sessions={[
          session({ netWpm: 40, durationSeconds: 30, completedAt: '2026-07-22T10:00:00.000Z' }),
          session({ netWpm: 88, durationSeconds: 60, completedAt: '2026-07-23T10:00:00.000Z' }),
        ]}
        onStartTest={() => {}}
      />,
    )
    expect(screen.getByText(/best wpm/i)).toBeInTheDocument()
    expect(screen.getByText(/time practiced/i)).toBeInTheDocument()
    expect(screen.getByText('1m 30s')).toBeInTheDocument() // 30 + 60 = 90s
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Dashboard/DashboardScreen.test.tsx`
Expected: FAIL — components missing.

- [ ] **Step 3: Create `src/components/Dashboard/StatCards.tsx`**

```tsx
import type { DashboardStats } from '../../dashboard/stats'

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

export function StatCards({ stats }: { stats: DashboardStats }) {
  const items = [
    { label: 'current wpm', value: `${stats.currentWpm}` },
    { label: 'best wpm', value: `${stats.bestWpm}` },
    { label: 'avg accuracy', value: `${stats.averageAccuracy}%` },
    { label: 'streak', value: `🔥 ${stats.streakDays}d` },
    { label: 'total tests', value: `${stats.totalTests}` },
    { label: 'time practiced', value: formatDuration(stats.totalSeconds) },
  ]
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
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

- [ ] **Step 4: Create `src/components/Dashboard/TrendChart.tsx`**

```tsx
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TrendPoint } from '../../dashboard/stats'

export function TrendChart({ series }: { series: TrendPoint[] }) {
  return (
    <div className="h-64 w-full rounded-lg bg-surface p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series}>
          <CartesianGrid stroke="#23262f" />
          <XAxis dataKey="index" stroke="#4b5060" fontSize={12} />
          <YAxis stroke="#4b5060" fontSize={12} width={32} />
          <Tooltip
            contentStyle={{ background: '#16181f', border: 'none', borderRadius: 8, color: '#e6e8ee' }}
            labelFormatter={(i) => `Test ${i}`}
          />
          <Legend />
          <Line type="monotone" dataKey="netWpm" name="WPM" stroke="#6c5cff" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="accuracy" name="Accuracy %" stroke="#8b7dff" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 5: Create `src/components/Dashboard/WeakAreas.tsx`**

```tsx
import type { DashboardStats } from '../../dashboard/stats'

export function WeakAreas({ weakLetters }: { weakLetters: DashboardStats['weakLetters'] }) {
  return (
    <div className="rounded-lg bg-surface p-4">
      <h3 className="mb-2 text-sm text-muted">weak areas (most mistyped)</h3>
      {weakLetters.length === 0 ? (
        <p className="text-muted">No mistakes recorded yet.</p>
      ) : (
        <ul className="space-y-1 font-mono">
          {weakLetters.map((w) => (
            <li key={w.letter} className="flex justify-between">
              <span className="text-error">{w.letter === ' ' ? '␣' : w.letter}</span>
              <span className="text-muted">{w.count} errors</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Add an optional `limit` prop to `src/components/Results/HistoryList.tsx`**

Replace the function signature line and the `recent` line:
```tsx
export function HistoryList({ sessions, limit = 5 }: { sessions: TypingSession[]; limit?: number }) {
  const recent = [...sessions].reverse().slice(0, limit)
```
(Everything else in the file is unchanged; the default keeps the results-screen behavior identical.)

- [ ] **Step 7: Create `src/components/Dashboard/DashboardScreen.tsx`**

```tsx
import { computeDashboardStats } from '../../dashboard/stats'
import type { TypingSession } from '../../storage/history'
import { StatCards } from './StatCards'
import { TrendChart } from './TrendChart'
import { WeakAreas } from './WeakAreas'
import { HistoryList } from '../Results/HistoryList'

type Props = {
  sessions: TypingSession[]
  onStartTest: () => void
}

export function DashboardScreen({ sessions, onStartTest }: Props) {
  if (sessions.length === 0) {
    return (
      <div className="mx-auto max-w-4xl p-6 text-center">
        <p className="mb-4 text-muted">Take your first test to see your progress here.</p>
        <button
          type="button"
          onClick={onStartTest}
          className="rounded-lg bg-accent px-5 py-2 text-white hover:bg-accent-soft"
        >
          Start a test
        </button>
      </div>
    )
  }

  const stats = computeDashboardStats(sessions)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <StatCards stats={stats} />
      <TrendChart series={stats.series} />
      <div className="grid gap-4 sm:grid-cols-2">
        <WeakAreas weakLetters={stats.weakLetters} />
        <HistoryList sessions={sessions} limit={10} />
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run src/components/Dashboard/DashboardScreen.test.tsx`
Expected: PASS (2 tests). (Recharts renders under jsdom thanks to the existing `ResizeObserver` stub in `vitest.setup.ts`.)

- [ ] **Step 9: Commit**

```bash
git add src/components/Dashboard/ src/components/Results/HistoryList.tsx
git commit -m "feat: dashboard screen with stat cards, trend chart, weak areas"
```

---

### Task 4: App wiring + navigation

**Files:**
- Modify: `src/App.tsx`
- Test: `src/App.test.tsx` (add a navigation test)

**Interfaces:**
- Consumes: `Nav` (Task 2), `DashboardScreen` (Task 3), `loadSessions` from `./storage/history`.
- Produces: a `'dashboard'` view reachable via the nav; `navigate(view)` refreshes sessions when opening the dashboard.

- [ ] **Step 1: Write the failing test — add to `src/App.test.tsx`**

Add inside the existing `describe('App', ...)` block:
```tsx
it('navigates between the test and dashboard views', async () => {
  render(<App />)
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  await user.click(screen.getByRole('button', { name: /^dashboard$/i }))
  expect(screen.getByText(/take your first test/i)).toBeInTheDocument() // empty dashboard (localStorage cleared)
  await user.click(screen.getByRole('button', { name: /^test$/i }))
  expect(screen.getByLabelText('typing input')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL — there is no Dashboard tab yet.

- [ ] **Step 3: Wire the dashboard into `src/App.tsx`**

Add imports:
```tsx
import { Nav } from './components/Nav'
import { DashboardScreen } from './components/Dashboard/DashboardScreen'
```
Widen the `view` state to include `'dashboard'`:
```tsx
  const [view, setView] = useState<'test' | 'results' | 'dashboard'>('test')
```
Add a `navigate` handler near the other callbacks (refreshes history when opening the dashboard):
```tsx
  const navigate = useCallback((v: 'test' | 'dashboard') => {
    if (v === 'dashboard') setSessions(loadSessions())
    setView(v)
  }, [])
```
Add the dashboard view branch right **before** the `if (view === 'results' ...)` block:
```tsx
  if (view === 'dashboard') {
    return (
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 p-6">
        <Nav active="dashboard" onNavigate={navigate} />
        <DashboardScreen sessions={sessions} onStartTest={() => navigate('test')} />
      </div>
    )
  }
```
Finally, in the test-view JSX, replace the existing header block:
```tsx
      <header className="flex items-center justify-between">
        <span className="font-mono text-lg text-accent">TypePilot</span>
        <ConfigBar
          mode={config.mode}
          duration={config.durationSeconds}
          disabled={engine.state.status === 'running'}
          onChange={(c) => { setCustomTarget(undefined); setConfig({ mode: c.mode, durationSeconds: c.duration }) }}
        />
      </header>
```
with a nav row above a right-aligned config row:
```tsx
      <Nav active="test" onNavigate={navigate} />
      <header className="flex items-center justify-end">
        <ConfigBar
          mode={config.mode}
          duration={config.durationSeconds}
          disabled={engine.state.status === 'running'}
          onChange={(c) => { setCustomTarget(undefined); setConfig({ mode: c.mode, durationSeconds: c.duration }) }}
        />
      </header>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS (all App tests, including the new navigation test).

- [ ] **Step 5: Full suite + build**

Run: `npm test && npm run build`
Expected: all tests pass; the build succeeds with no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "feat: dashboard view and navigation"
```

---

## Self-Review Notes

- **Spec coverage:** stats module with all metrics + streak + weak-letter aggregation + series (T1), Nav with active tab (T2), StatCards / TrendChart (WPM + accuracy) / WeakAreas / recent tests / empty state (T3), App `'dashboard'` view + nav wiring + sessions refresh (T4). ✅
- **Deferred (spec §8):** time-range filters, auth/cloud sync, achievements/XP, keyboard heatmap, daily-goal tracking.
- **Determinism:** streak uses the UTC date slice of the ISO `completedAt`, so `stats.test.ts` is timezone-independent.
- **Type consistency:** `DashboardStats`/`TrendPoint` defined once in `src/dashboard/stats.ts` and consumed by `StatCards`, `TrendChart`, `WeakAreas`, `DashboardScreen`; `NavView` defined in `Nav.tsx`; App's `navigate` accepts `'test' | 'dashboard'` matching `Nav`'s `onNavigate`.
- **No regressions:** `HistoryList` gains an optional `limit` (default 5) — the results screen keeps its current behavior; the dashboard passes `limit={10}`.
