# TypePilot — Progress Dashboard — Design

**Date:** 2026-07-23
**Scope:** A progress dashboard built entirely on the existing `localStorage` session history — trends, stat cards, weak areas, recent tests — plus light navigation between the Test and Dashboard views. No authentication and no backend.
**Status:** Approved for implementation planning.
**Depends on:** the shipped MVP (typing engine + results + `localStorage` history) and the rule-based coach.

## 1. Goal

Turn the accumulated test history into a at-a-glance progress view: how fast and accurate the user is over time, their best and average, a practice streak, and where they keep slipping. This closes the "Improve → Repeat" side of the roadmap loop by making progress visible, without needing accounts or a server.

## 2. Decisions (locked)

| Decision | Choice |
|----------|--------|
| Data source | Existing `localStorage` history (`TypingSession[]`) — no new persistence |
| Auth / backend | None |
| Navigation | A slim top nav (logo + Test / Dashboard tabs) on the Test and Dashboard views; hidden during Results |
| Charting | Recharts (already a dependency) |
| Trend lines | WPM and accuracy, over test history (oldest → newest) |
| Time range | All-time only for now (range filters deferred) |
| Stats logic | A pure, unit-tested `computeDashboardStats` function |

## 3. Architecture

Adds a third view. `App`'s `view` becomes `'test' | 'results' | 'dashboard'`. A `Nav` component renders on the test and dashboard views and switches between them. All numbers derive from the history already saved by `src/storage/history.ts`.

```
src/
  dashboard/
    stats.ts          computeDashboardStats(sessions): DashboardStats  (pure)
    stats.test.ts
  components/
    Nav.tsx           logo + Test/Dashboard tabs; active tab highlighted
    Dashboard/
      DashboardScreen.tsx   layout + empty state
      StatCards.tsx         the six headline metrics
      TrendChart.tsx        WPM + accuracy over time (Recharts)
      WeakAreas.tsx         aggregated most-mistyped letters
  App.tsx             (modified: 'dashboard' view + Nav wiring)
```

The engine, storage, coach, and results components are untouched except for App wiring. The recent-tests table reuses the existing `HistoryList` visual style (a fuller variant lives in the dashboard).

## 4. Stats module (`stats.ts`)

```ts
type TrendPoint = { index: number; netWpm: number; accuracy: number }

type DashboardStats = {
  currentWpm: number       // most recent session's netWpm (0 if none)
  bestWpm: number          // max netWpm (0 if none)
  averageAccuracy: number  // mean accuracy, rounded (0 if none)
  totalTests: number
  totalSeconds: number     // sum of durationSeconds
  streakDays: number       // consecutive days ending at the most recent test day
  weakLetters: { letter: string; count: number }[]  // top 6 aggregated across history
  series: TrendPoint[]      // one point per session, oldest -> newest
}

function computeDashboardStats(sessions: TypingSession[]): DashboardStats
```

Details:
- **Ordering:** `completedAt` ascending defines "oldest → newest"; `currentWpm` is the newest.
- **streakDays:** collect the set of unique calendar days (from `completedAt`); starting at the most recent test's day, count backward while each preceding day is also present. Single-day history → streak 1; a gap breaks it. Uses local date (`YYYY-MM-DD`).
- **weakLetters:** sum each session's `mistypedLetters` into one map, sort by count desc, take top 6.
- **Empty history:** all numeric fields 0, `weakLetters` and `series` empty.

This is the correctness-critical unit and is tested with fixed fixtures (including broken-streak, single-day, and empty cases).

## 5. Dashboard screen

- **StatCards** — a responsive grid: Current WPM · Best WPM · Avg Accuracy · Streak (🔥 N days) · Total Tests · Time Practiced (formatted from `totalSeconds`, e.g. "12m 30s" / "1h 05m").
- **TrendChart** — a Recharts line chart of `series`: WPM as the primary line and accuracy as a second line, styled to match the results-screen chart. With a single data point, the chart still renders (a single marker).
- **WeakAreas** — the top aggregated mistyped letters shown as letter + count (color-independent), matching the results "most mistyped letters" style; empty → "No mistakes recorded yet."
- **Recent tests** — the existing `HistoryList` table style (date · mode · WPM · accuracy · duration), most-recent first, up to ~10 rows.
- **Empty state** — when there is no history: a friendly "Take your first test to see your progress here." with a button that navigates to the Test view.

## 6. Navigation

`Nav` shows the "TypePilot" logo and two tabs, **Test** and **Dashboard**, with the active view highlighted. It renders at the top of the test and dashboard views. Results keeps its existing Repeat / New Test buttons and shows no nav (New Test returns to the test view, where the Dashboard tab is one click away). Switching to Test from the dashboard shows the current test screen unchanged.

## 7. Testing

- `stats.ts`: per-metric unit tests — best/average/current WPM, average accuracy, total tests, total seconds, streak (multi-day consecutive, broken by a gap, single day), weak-letter aggregation/ordering, and the empty-history case.
- `Nav.tsx`: renders both tabs, marks the active one, and calls the navigate handler on click.
- `DashboardScreen.tsx`: renders stat values from a fixture; shows the empty state with no history and fires the "start a test" handler.
- `App.test.tsx`: navigating to the Dashboard tab shows the dashboard; navigating back shows the test.

## 8. Out of scope (later slices)

Time-range filters (7 days / 30 days / all), authentication and cloud sync, achievements/XP/levels, the per-key keyboard heatmap, and daily-goal tracking. The `DashboardStats` shape and the `dashboard/` boundary are structured so these can layer on without rework.
