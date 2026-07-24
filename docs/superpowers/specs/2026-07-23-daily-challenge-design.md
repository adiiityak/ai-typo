# TypePilot — Daily Challenge + Streak Goal — Design

**Date:** 2026-07-23
**Scope:** A daily practice goal ("complete 3 tests today") with progress and the practice streak, surfaced on the test screen. Pure client-side, built on the existing `localStorage` history.
**Status:** Approved for implementation planning.
**Depends on:** the shipped MVP engine, results, dashboard (which already computes a practice streak), and history storage.

## 1. Goal

Give returning users a small, satisfying reason to come back each day: a clear daily goal with visible progress, plus their practice streak, shown on the test screen before they start typing. Everything derives from history already stored — no new persistence, no backend.

## 2. Decisions (locked)

| Decision | Choice |
|----------|--------|
| Daily goal | Fixed: complete **3 tests** today (`DAILY_GOAL_TESTS = 3`) |
| "Today" | A `YYYY-MM-DD` UTC key (matching the dashboard streak), passed into the pure function |
| Streak | Reuses the dashboard's practice-streak logic, extracted to a shared `practiceStreak` helper |
| Placement | On the **test screen**, hidden while a test is actively running |
| Persistence | None new — derived from existing `TypingSession[]` history |
| Logic | A pure, unit-tested `computeDailyChallenge` function |

## 3. Architecture

Two pure functions and one compact component, wired into the test view.

```
src/dashboard/stats.ts     refactor: export practiceStreak(sessions); computeDashboardStats reuses it
src/challenge/daily.ts     computeDailyChallenge(sessions, todayKey): DailyChallenge  (pure)
src/challenge/daily.test.ts
src/components/
  DailyChallengeCard.tsx   compact goal-progress + streak banner
  DailyChallengeCard.test.tsx
src/App.tsx                (modified: render the card on the test view, not while running)
```

The `stats.ts` refactor is DRY-only: `practiceStreak` is lifted out of `computeDashboardStats` and both callers use it. Existing dashboard stat values are unchanged.

## 4. Challenge module (`daily.ts`)

```ts
export const DAILY_GOAL_TESTS = 3

export type DailyChallenge = {
  goalTests: number
  completedToday: number
  done: boolean
  bestAccuracyToday: number | null
  streakDays: number
}

export function computeDailyChallenge(sessions: TypingSession[], todayKey: string): DailyChallenge
```

- `completedToday` — count of sessions whose `completedAt` (UTC date slice) equals `todayKey`.
- `bestAccuracyToday` — max accuracy among today's sessions, or `null` when none.
- `done` — `completedToday >= DAILY_GOAL_TESTS`.
- `streakDays` — `practiceStreak(sessions)`.

## 5. Shared streak (`stats.ts`)

```ts
export function practiceStreak(sessions: TypingSession[]): number
```
- Consecutive UTC days ending at the most recent test's day that each have ≥1 test; `0` for empty history; single day → `1`.
- `computeDashboardStats` calls this for its `streakDays` field (value unchanged from today's behavior).

## 6. UI (`DailyChallengeCard`)

A single compact banner: a "Daily goal" label, a progress bar (`completedToday / goalTests`, capped at 100%), a status (`N / 3 tests`, or `✓ done` when complete), and the streak (`🔥 N`). It calls `computeDailyChallenge` directly — synchronous, no local state.

**Placement:** rendered on the test view between the header and the live metrics, only when `engine.state.status !== 'running'` (visible while idle or finished-and-back, hidden mid-test to preserve focus). `App` passes `sessions` and `today = new Date().toISOString().slice(0, 10)`. Because `sessions` state refreshes when a test finishes and when navigating, the progress reflects completed tests without extra plumbing.

## 7. Testing

- `daily.ts`: empty history (0/3, not done, null accuracy, streak 0); counting today's sessions vs earlier ones; the done threshold at 3; best-accuracy-today; streak passthrough.
- `stats.ts`: existing dashboard tests continue to pass after the `practiceStreak` extraction (no value changes); `practiceStreak` covered via the existing streak assertions.
- `DailyChallengeCard.tsx`: renders the in-progress state (`1 / 3 tests`) and the `✓ done` state from fixtures.
- `App.test.tsx`: the daily-goal card appears on the test screen on load.

## 8. Out of scope (later)

Rotating or AI-generated daily challenges, goal customization (accuracy/word-count targets), notifications/reminders, and showing the card on the dashboard. The `DailyChallenge` shape and `computeDailyChallenge` boundary are structured so a richer goal system can replace the fixed goal without UI changes.
