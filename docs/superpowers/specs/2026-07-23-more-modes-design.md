# TypePilot — Numbers & Punctuation Modes — Design

**Date:** 2026-07-23
**Scope:** Add two new test modes — Numbers and Punctuation — to the typing engine and config bar. Contained content/engine work; no changes to how tests run, results compute, the dashboard, or the coach.
**Status:** Approved for implementation planning.
**Depends on:** the shipped MVP engine, results, dashboard, and rule-based coach.

## 1. Goal

Broaden practice variety with two focused modes: typing numbers, and typing text with real punctuation. Punctuation mode in particular makes the coach's existing punctuation-weakness detection directly practiceable. Both modes reuse the entire existing pipeline — the engine already types any target string and keys mistakes by the expected character.

## 2. Decisions (locked)

| Decision | Choice |
|----------|--------|
| New modes | `numbers`, `punctuation` (added to the existing `words`, `quotes`) |
| Generation | Deterministic, seedable (an `rng` parameter, defaulting to `Math.random`) like the existing generators |
| Numbers content | Space-separated digit groups, 1–4 digits each |
| Punctuation content | Sentences from the common-word list with capitalized starts, mid-sentence commas, terminal `.`/`?`/`!`, occasional semicolons |
| Downstream impact | None — engine, metrics, results, dashboard, coach are all mode-agnostic |
| Out of scope | Code mode, Custom Text |

## 3. Architecture

All changes are localized to content generation, the `Mode` type, and the config bar.

```
src/engine/
  types.ts        Mode widened to 'words' | 'quotes' | 'numbers' | 'punctuation'
  content.ts      + generateNumbers(count, rng), generatePunctuation(count, rng); buildTarget switch
src/components/
  ConfigBar.tsx   MODES list gains 'numbers' and 'punctuation'
```

Because `TypingSession.mode`, `CoachInput.mode`, `ConfigBar` props, and `buildCoachInput` all take `Mode`, widening the union flows through with no logic changes. No component switches exhaustively on `Mode`, so nothing breaks. Mistyped-letter aggregation, the coach's punctuation detection (`isPunctuation`), and the dashboard weak-areas all handle digits and punctuation already.

## 4. Content generators (`content.ts`)

```ts
generateNumbers(count: number, rng?: () => number): string
```
- Produces `count` space-separated groups; each group is 1–4 random digits.
- Output matches `/^[0-9 ]+$/`. Deterministic given a seeded `rng`.

```ts
generatePunctuation(wordCount: number, rng?: () => number): string
```
- Draws words from the existing common-word list, grouped into sentences of ~5–9 words.
- Each sentence: first word capitalized, one comma inserted mid-sentence, terminated with `.` (mostly), occasionally `?`, `!`, or a `;` joining a following clause.
- Contains at least one comma and one terminal period for any reasonable length. Deterministic given a seeded `rng`.

```ts
buildTarget(mode: Mode, duration: Duration, rng?: () => number): string
```
- Switch over the four modes. `words`/`numbers`/`punctuation` generate a stream sized to the duration (`ceil(duration * 3) + 20` units, matching the current words sizing); `quotes` returns a single quote as today.

## 5. Config bar (`ConfigBar.tsx`)

The `MODES` list becomes `['words', 'quotes', 'numbers', 'punctuation']`, rendering four mode pills followed by the existing duration pills. No other changes; selecting a mode continues to call `onChange({ mode, duration })`, and the App already clears any custom target and rebuilds the test on config change.

## 6. Testing

- `content.test.ts` (extends existing):
  - `generateNumbers`: exact count of groups, only digits and spaces, determinism under a seeded rng.
  - `generatePunctuation`: contains a comma and a terminal period, capitalized first character, determinism under a seeded rng.
  - `buildTarget`: `numbers` yields a digits/spaces stream longer than a threshold; `punctuation` yields a passage containing punctuation.
- `ConfigBar.test.tsx` (new): all four mode pills render; clicking `numbers` fires `onChange` with `{ mode: 'numbers', duration }`.
- Full suite + build must stay green (verifying the `Mode` widening ripples cleanly).

## 7. Out of scope (later)

Code typing mode, Custom Text mode, per-mode difficulty presets, and any mode-specific results treatment. The `buildTarget` switch and `Mode` union are structured so further modes slot in without touching the engine or UI wiring.
