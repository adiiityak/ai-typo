# TypePilot

**An AI-powered typing coach — not just another WPM counter.**

Most typing-speed testers tell you *how fast* you typed and stop there. TypePilot is being built to tell you *why* you type the way you do — which keys slow you down, where your accuracy breaks, and what to practice next — and to turn every test into a personalized training session.

> **Status:** The core typing engine + results experience (the MVP) is complete and working. The AI coaching layer is the next phase — see [Roadmap](#roadmap).

---

## What it does today (MVP)

The foundation is the loop everything else hangs off of: **Type → Measure → Understand.**

- **Timed typing tests** — Words or Quotes mode, 30s or 60s.
- **Live per-character feedback** — every character shows as untyped / correct / incorrect / current, with a smooth caret and no layout shift while you type.
- **Trustworthy metrics** — the numbers are the whole point, so they're computed from a full keystroke event log and unit-tested:
  - **Gross WPM** = characters ÷ 5 ÷ minutes
  - **Net WPM** = Gross − (errors ÷ minutes), floored at 0
  - **Accuracy** = correct ÷ total typed × 100
  - **Consistency** = derived from per-second WPM variance
- **Rich results screen** — WPM-over-time chart, most-mistyped letters, slowest words, backspace count, and a personal-best badge.
- **Local history** — completed sessions and your personal best persist in the browser (`localStorage`) — no account needed.
- **Backspace anywhere** — Monkeytype-style: you can correct freely, but original errors still count toward accuracy.

Everything runs 100% client-side. There's no backend, no tracking, and no network calls during a test.

## Tech stack

- **[Vite](https://vitejs.dev/)** + **React 18** + **TypeScript** (strict)
- **Tailwind CSS v4** for styling (dark theme, electric-violet accent)
- **[Recharts](https://recharts.org/)** for the performance timeline
- **[Vitest](https://vitest.dev/)** + Testing Library for the test suite (47 tests)

## Getting started

Requires **Node.js 18+** and npm.

```bash
# install dependencies
npm install

# start the dev server (http://localhost:5173)
npm run dev

# run the test suite
npm test

# type-check and build for production
npm run build
```

## Project structure

The typing engine is deliberately **framework-free and fully unit-tested** — React only wires it to input, a timer, and rendering.

```
src/
  engine/            # pure, testable logic (no React)
    content.ts         word list + quotes, passage generation
    keystroke.ts       reducer: applies each keypress/backspace to test state
    metrics.ts         WPM, accuracy, consistency, aggregates, timeline
    types.ts
  storage/
    history.ts         localStorage session history + personal best
  hooks/
    useTypingEngine.ts # wires engine + countdown timer + input into React
  components/
    ConfigBar.tsx      mode + duration selection
    TypingArea.tsx     passage rendering with per-character states
    LiveMetrics.tsx    live timer / WPM / accuracy (with focus toggle)
    Results/           results screen: metric grid, chart, error breakdown, history
  App.tsx              owns view state (test ↔ results) + persistence
```

Design docs live under [`docs/superpowers/`](docs/superpowers/) — the [design spec](docs/superpowers/specs/2026-07-22-typing-mvp-design.md) and [implementation plan](docs/superpowers/plans/2026-07-22-typing-mvp.md).

## Roadmap

The MVP is the engine room. The differentiator — the AI coaching loop — comes next.

**Built ✅**
- Typing engine (Words / Quotes, 30s / 60s)
- Real-time character validation
- Full metrics + results screen
- Local session history & personal best

**Planned**
- **AI performance analysis** — a concise post-test coach summary (strength, weakness, next step)
- **Personalized passage generation** — practice text targeting your weak letters and patterns
- **Adaptive difficulty** — the next test adjusts to your recent accuracy/speed
- **Daily training plan** & progress dashboard
- **AI chat coach** with access to your typing stats
- More modes (Numbers, Punctuation, Code) and a keyboard mistake heatmap

## License

TBD.
