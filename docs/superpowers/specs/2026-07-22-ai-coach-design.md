# TypePilot — Coach (Rule-Based, No API) — Design

**Date:** 2026-07-22
**Scope:** Phase 5, Slice 1 of the TypePilot roadmap — post-test coaching feedback and a personalized practice passage, implemented with **deterministic rule-based logic** (no LLM, no external API, no key). Defers daily plan, chat coach, and adaptive difficulty to later slices.
**Status:** Approved for implementation planning.
**Depends on:** the shipped MVP (typing engine + results + localStorage history).
**Supersedes:** the earlier Gemini-based version of this spec — the LLM backend is dropped entirely.

## 1. Goal

Turn a finished test into a coaching moment, using only the metrics we already compute. After a test, the user sees a short, specific analysis — one strength, one weakness, one recommendation (e.g. *"You're fast, but your accuracy drops on punctuation."*) — and can start a personalized practice passage built from their own weak letters, fed into the existing typing engine. This is the "Understand → Practise" half of the roadmap's core loop.

## 2. Decisions (locked)

| Decision | Choice |
|----------|--------|
| Intelligence | Rule-based heuristics — deterministic, in-browser |
| External services | **None** — no LLM, no API, no key, no network, no backend |
| Runtime | Pure synchronous functions; the app stays a static site (works offline) |
| Coaching output | `{ strength, weakness, recommendation, exerciseType }` |
| Passage output | `{ passage, focus }` |
| Timing | Computed only after a test completes, on the results screen |
| Determinism | Same metrics → same coaching + same passage (fully testable, no mocks) |

## 3. Architecture

Two pure client-side modules plus a results-screen card and a small engine tweak. No `server/`, no `.env`, no `fetch`.

```
src/
  coach/
    summary.ts     CoachInput type + CoachAnalysis type + buildCoachInput(metrics, mode, duration, history)
    analyze.ts     analyze(input) -> CoachAnalysis  (rule-based)
    passage.ts     generatePassage(input) -> { passage, focus }  (rule-based)
  components/Results/
    AiCoachCard.tsx   renders analysis instantly + "Start recommended exercise"
  hooks/useTypingEngine.ts   (modified: optional customTarget)
  App.tsx                    (modified: customTarget state + start-exercise handler)
```

Because the coach is synchronous and can never fail on a network, there are no loading or error/fallback states — the card always renders the analysis. The engine, storage, and other components are untouched except for mounting the card and wiring the start-exercise button.

## 4. Coach input

Built from data already on the results screen (`Metrics`) plus localStorage history:

```ts
type CoachInput = {
  netWpm: number; grossWpm: number; accuracy: number; consistency: number
  weakLetters: string[]     // top ~5 from mistypedLetters, most-missed first
  slowestWords: string[]    // from metrics.slowestWords
  backspaceCount: number
  recentAverageWpm: number  // mean netWpm over history (0 if none)
  mode: 'words' | 'quotes'; durationSeconds: 30 | 60
}
```

## 5. Analysis rules (`analyze.ts`)

Deterministic, priority-ordered. `analyze(input)` returns `{ strength, weakness, recommendation, exerciseType }`.

**Strength** — first match wins:
1. `accuracy >= 97` → excellent accuracy
2. `recentAverageWpm > 0 && netWpm >= recentAverageWpm + 3` → faster than recent average
3. `consistency >= 85` → very steady pace
4. `netWpm >= 60` → strong speed
5. else → solid steady pace

**Weakness + kind** — first match wins (kind drives recommendation + `exerciseType`):
1. `accuracy < 90` → kind `accuracy` → `accuracy_warmup`
2. any weak letter is punctuation (non-alphanumeric, non-space) → kind `punctuation` → `punctuation_accuracy`
3. there are alphabetic weak letters and `accuracy < 97` → kind `letters` (names top 3) → `weak_letter_drill`
4. `backspaceCount >= 15` → kind `backspace` → `no_backspace`
5. `consistency < 60` → kind `consistency` → `rhythm`
6. else → kind `none` (no major weak spot) → `speed`

Each kind maps to a fixed, human recommendation string (e.g. `punctuation` → "Practice a punctuation-heavy passage, focusing on commas and periods.").

## 6. Passage generation (`passage.ts`)

`generatePassage(input)` returns `{ passage, focus }`, deterministically:
- `focus` = alphabetic weak letters, top 3 (empty if none).
- Draw from a curated word bank, preferring words that contain a focus letter; fall back to the full bank if too few match.
- Assemble ~45 words by iterating the preferred pool in order (repeating to reach the target length) — deterministic, no randomness.
- If a weak letter is punctuation, format the words into sentences (capitalized starts, commas at a fixed cadence, periods to end sentences) so the passage actually exercises punctuation.

The result is loaded into the existing typing engine as a custom target (the engine already accepts any string).

## 7. Client integration

- **AI Coach card** on the results screen: computes `analyze(coachInput)` synchronously (via `useMemo`) and renders strength / weakness / recommendation, plus a **Start recommended exercise** button.
- **Start recommended exercise** → `generatePassage(coachInput)` (synchronous) → load the passage into the engine as a custom target and switch to the test view.
- Selecting a new mode/duration clears the custom target so normal generation resumes.

## 8. Testing

All deterministic, no mocks, no network:
- `summary.ts`: `Metrics` + history → correct `CoachInput` (weak-letter ordering, recent-average math, empty history).
- `analyze.ts`: representative metric scenarios → expected strength phrase, weakness kind, and `exerciseType` (high accuracy, low accuracy, punctuation-weak, letter-weak, fast-vs-recent, clean run).
- `passage.ts`: passage contains focus letters, honors length bounds, injects punctuation when punctuation is weak, and is identical for identical input.
- `AiCoachCard.tsx`: renders the analysis and the start button; clicking it invokes the handler.
- `App.tsx`: finishing a test then clicking start loads the generated passage into the engine.

## 9. Out of scope (later slices)

Real LLM integration, AI daily training plan, chat coach, adaptive difficulty auto-adjustment, cross-test mistake-pattern detection, keyboard heatmap, gamification. The `CoachInput` contract and the `coach/` module boundary are structured so a real LLM could later back `analyze`/`generatePassage` behind the same interfaces without touching the UI.
