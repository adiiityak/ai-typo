# TypePilot — MVP Typing Engine + Results — Design

**Date:** 2026-07-22
**Scope:** Phase 2 (MVP Typing Engine) + Phase 3 (Results & Analytics) of the TypePilot roadmap.
**Status:** Approved for implementation planning.

## 1. Goal

Build the reliable core loop of an AI typing coach product — **before** any AI, auth, or backend:

> Pick a mode and duration → take a timed typing test with live per-character feedback → see accurate, trustworthy results (WPM, accuracy, consistency, error breakdown) → results persist locally so a personal best and recent history exist.

The guiding principle from the roadmap: *"A tiny, reliable engine beats a glittering keyboard spaceship that miscalculates WPM."* Correctness of the metrics is the single most important success criterion.

## 2. Decisions (locked)

| Decision | Choice |
|----------|--------|
| Platform | Web app |
| Stack | Vite + React + TypeScript + Tailwind CSS (client-only, no backend) |
| Test modes | Words + Quotes |
| Durations | 30s and 60s |
| Backspace | Allowed anywhere; original errors still recorded for accuracy |
| Persistence | `localStorage` — session history + personal best |
| Chart | Recharts (WPM-over-time timeline) |
| State | React hooks only (no Zustand until AI/dashboard phases) |
| Theme | Dark, electric-blue/violet accent, monospace passage font |

## 3. Architecture

Pure client-side SPA. No router library — a single `view` state flips between **Test** and **Results**. The typing engine is **framework-free and unit-tested**; React only wires it to input, timer, and rendering.

```
src/
  engine/            # pure, testable logic (no React imports)
    content.ts         word list (~200 common words) + quotes (~30)
    keystroke.ts       reducer: applies each keypress/backspace to test state
    metrics.ts         WPM, accuracy, consistency, aggregates, timeline
    types.ts
  storage/
    history.ts         localStorage read/write + personal-best derivation
  hooks/
    useTypingEngine.ts # wires engine + countdown timer + input into React
  components/
    ConfigBar.tsx      mode (Words|Quotes) + duration (30|60)
    TypingArea.tsx     passage render, per-char states, caret, hidden input capture
    LiveMetrics.tsx    timer / WPM / accuracy (live-WPM toggle for focus)
    Results/
      ResultsScreen.tsx
      MetricGrid.tsx
      WpmTimelineChart.tsx
      ErrorBreakdown.tsx    most-mistyped letters + slowest words
      HistoryList.tsx       recent tests + personal-best badge
  App.tsx              owns view state + selected config
```

## 4. Typing engine

### 4.1 Event log (source of truth)

Every character-producing keypress appends a `CharacterEvent`:

```ts
type CharacterEvent = {
  expected: string
  typed: string
  timestamp: number   // ms since test start
  isCorrect: boolean
  corrected: boolean  // true if later backspaced over
}
```

All metrics are derived from this log — nothing is computed ad-hoc in the UI. Backspace is tracked separately as a count and moves the cursor back, but the original (possibly wrong) event stays in the log so accuracy reflects what the user actually typed (Monkeytype-style).

### 4.2 State machine

```
idle ──(first keystroke)──▶ running ──(timer reaches 0)──▶ finished
  ▲                                                          │
  └──────────────── restart / new test ─────────────────────┘
```

- Timer counts **down** from the selected duration.
- **Words mode:** generate a long random stream of common words (enough to never run out in 60s).
- **Quote mode:** pick a random quote; if finished before time, test ends early on last char.
- **Overflow** (typing past a word before space) renders and counts as error characters.

### 4.3 Metrics (roadmap formulas)

- **Gross WPM** = totalCharsTyped ÷ 5 ÷ minutes
- **Net WPM** = Gross − (errors ÷ minutes), floored at 0
- **Accuracy** = correctChars ÷ totalCharsTyped × 100
- **Consistency** = 100 − coefficient of variation of per-second WPM samples (clamped 0–100)
- **Backspace count**, **most-mistyped letters** (aggregate incorrect events by expected char), **slowest words** (time between word completions), **WPM timeline** (WPM sampled each second).

## 5. Screens

### Test screen
- Config bar: Words/Quotes toggle, 30s/60s toggle.
- Live metrics row: timer, WPM, accuracy — with a **hide-live-WPM** toggle for focus.
- Passage centered, monospace. **No reflow while typing** — the caret moves and lines scroll; text never jumps.
- Character states: untyped = muted grey · correct = bright foreground · incorrect = red (wrong char shown) · current = animated caret.
- Restart button (also `Tab`/`Esc` friendly).

### Results screen
- Large **Net WPM**, then Accuracy / Consistency / Gross WPM / error count grid with animated counters.
- **WPM-over-time line chart** (Recharts).
- Error breakdown: most-mistyped letters, slowest words.
- Personal-best badge when beaten; recent-tests list.
- Buttons: **Repeat** (same config), **New Test** (back to config).

## 6. Persistence

Completed sessions saved to `localStorage` under a single key as an array of `TypingSession`:

```ts
type TypingSession = {
  id: string
  mode: 'words' | 'quotes'
  durationSeconds: 30 | 60
  grossWpm: number
  netWpm: number
  accuracy: number
  consistency: number
  correctCharacters: number
  incorrectCharacters: number
  backspaceCount: number
  completedAt: string         // ISO
  timeline: number[]          // per-second WPM, for the chart
  mistypedLetters: Record<string, number>
}
```

Personal best = max `netWpm` across history. History list shows the most recent N sessions.

## 7. Testing

- **Vitest**, test-first, for the engine:
  - keystroke reducer: correct/incorrect classification, backspace behavior, overflow, cursor bounds.
  - metrics: gross/net WPM, accuracy, consistency, backspace count, mistyped-letter aggregation, slowest-word timing, timeline sampling — with fixed synthetic event logs and known expected values.
- Component tests kept light; engine correctness is the priority.

## 8. Look & accessibility

- Dark theme, electric-blue/violet accent, Inter for UI, monospace for the passage.
- Respects `prefers-reduced-motion` (disables caret pulse / counter animation).
- Color-independent error indication (wrong character is shown, not just colored).

## 9. Explicitly out of scope (deferred to later roadmap phases)

AI coach, AI passage generation, adaptive difficulty, daily plans, chat assistant, authentication, dashboard, streaks, gamification/XP/leaderboards, keyboard heatmap, and the Numbers / Punctuation / Code / Custom-text modes. The engine and data model are structured so these can be layered on without rework (e.g. the event log already carries what the AI features will summarize).
