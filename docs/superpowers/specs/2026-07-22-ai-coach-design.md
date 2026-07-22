# TypePilot — AI Coach (Analysis + Passage Generation) — Design

**Date:** 2026-07-22
**Scope:** Phase 5, Slice 1 of the TypePilot roadmap — the first AI features: post-test coaching analysis and a personalized practice-passage generator. Defers the daily plan, chat coach, and adaptive difficulty to later slices.
**Status:** Approved for implementation planning.
**Depends on:** the shipped MVP (typing engine + results + localStorage history).

## 1. Goal

Turn a finished test into a coaching moment. After a test, the user sees a short, specific AI analysis (one strength, one weakness, one recommendation) and can start a personalized practice passage generated to target their weak letters and slow words — fed straight into the existing typing engine. This is the "Understand → Practise" half of the roadmap's core loop.

## 2. Decisions (locked)

| Decision | Choice |
|----------|--------|
| LLM provider | Google Gemini (free tier) |
| SDK | `@google/genai` (Google Gen AI SDK for JS/TS) — **not** the Anthropic SDK |
| Model | `gemini-2.5-flash`, overridable via `COACH_MODEL` env var |
| API key | `GEMINI_API_KEY`, server-side only (never in the browser) |
| Backend | Small Node + Express server in `server/`, run alongside Vite in dev |
| Structured analysis | Gemini structured output: `responseMimeType: "application/json"` + `responseSchema` |
| Passage output | Plain text |
| AI timing | Only after a test completes — never during typing |
| Data sent | A compact metrics summary only — never keystrokes or raw text |
| Failure behavior | AI is additive; results always render even when AI fails |

## 3. Architecture

The project becomes two processes: the existing Vite SPA (frontend) and a new Express API server that holds `GEMINI_API_KEY` and calls Gemini. The key never reaches the browser.

```
server/
  index.ts            Express app: JSON body parsing, CORS (dev), error middleware
  gemini.ts           GoogleGenAI client (reads GEMINI_API_KEY + COACH_MODEL from env)
  prompts.ts          system + user prompt builders (pure functions)
  schema.ts           response schema for the structured analysis
  summary.ts          builds the CoachInput payload from a TypingSession
  routes/
    analyze.ts        POST /api/analyze  → { strength, weakness, recommendation, exerciseType }
    passage.ts        POST /api/passage  → { passage, focus }
src/
  api/coach.ts        typed client wrapper (fetch + timeout + error normalization)
  components/Results/
    AiCoachCard.tsx    loading / coach / fallback states on the results screen
```

- **Dev:** Vite proxies `/api/*` → `http://localhost:3001` (added to `vite.config.ts`). `npm run dev` runs both processes via `concurrently` (`dev:web` + `dev:api`).
- **Server runtime:** Express + `tsx` (or `ts-node`) for dev; the server is deployable later as serverless functions with minimal glue, but a plain server keeps it runnable and testable now.
- The engine, storage, and existing components are untouched except for mounting the new coach card and wiring the "Start Recommended Exercise" button.

## 4. Data contract (client → server)

Per the roadmap's hard rule (*"Do not send every keystroke to the AI"*), the client sends only a compact summary, derived from data already computed for the results screen:

```ts
type CoachInput = {
  netWpm: number
  grossWpm: number
  accuracy: number            // 0–100
  consistency: number         // 0–100
  weakLetters: string[]       // top ~5 from mistypedLetters, most-missed first
  slowestWords: string[]      // from slowestWords
  backspaceCount: number
  recentAverageWpm: number    // mean netWpm over localStorage history (0 if none)
  mode: 'words' | 'quotes'
  durationSeconds: 30 | 60
}
```

`summary.ts` builds this from a `TypingSession` + the loaded history. No raw typed text, no per-keystroke data, no PII.

## 5. Endpoints

### `POST /api/analyze`
- Body: `CoachInput`.
- Calls Gemini with a supportive-coach system instruction (roadmap's analysis prompt: one strength, one weakness, a concise explanation, one next action, a recommended exercise type; <100 words; no shaming; no generic advice) and **structured output** enforced by `responseSchema`.
- Returns (validated shape):
  ```ts
  { strength: string; weakness: string; recommendation: string; exerciseType: string }
  ```

### `POST /api/passage`
- Body: `CoachInput` (or a subset: level, focus letters/words, mode).
- Calls Gemini with the roadmap's passage-generation prompt (repeat focus patterns naturally, match difficulty, don't exceed target length by >10%, return only the passage).
- Returns: `{ passage: string; focus: string[] }`.

Both routes: validate the request body, call Gemini, and map any provider error (missing key, rate limit, timeout, malformed output) to a clean JSON error `{ error: string; code: string }` with an appropriate HTTP status. No secrets in error responses.

## 6. Client integration

- **AI Coach card** on the results screen: on mount, `POST`s the summary to `/api/analyze`. Three states:
  1. **Loading** — skeleton placeholder.
  2. **Coach** — strength, weakness, recommendation, and a *Start Recommended Exercise* button.
  3. **Fallback** — friendly message ("Coach is unavailable right now — your results are saved.") on any error/timeout. Results are never blocked by the AI call.
- **Start Recommended Exercise** → `POST /api/passage`, then load the returned passage into the **existing typing engine** as a custom target (the engine already accepts any string; no engine changes needed). This lands the user in a practice test built from their own weak spots.
- `src/api/coach.ts`: typed `analyze(input)` and `generatePassage(input)` with a ~15s timeout and normalized errors, so components handle one clean success/failure contract.

## 7. Error handling & resilience

- **No AI calls during a test** — only after completion, on the results screen.
- **Missing/!invalid `GEMINI_API_KEY`** → server returns a clear `code: "not_configured"`; client shows the fallback with a dev-only hint. The app still works fully without a key.
- **Timeouts / rate limits / provider 5xx** → fallback UI; results and history intact.
- **Malformed model output** on `/api/analyze` is largely prevented by `responseSchema`; if parsing still fails, treat as an error → fallback.

## 8. Testing

- **Server (unit, deterministic — no live API):**
  - `summary.ts`: `TypingSession` + history → correct `CoachInput` (weak-letter ordering, recent-average math, empty-history case).
  - `prompts.ts`: prompt builders include the focus letters/words and honor constraints.
  - `routes/*`: the Gemini client is **mocked**; assert the right model/schema/params are sent and that provider errors map to the correct HTTP status + error code. No network calls in tests.
- **Client (unit):**
  - `coach.ts`: `fetch` mocked — success, HTTP error → normalized error, timeout.
  - `AiCoachCard.tsx`: renders loading → coach on success, loading → fallback on error.
- No live LLM calls anywhere in the suite; everything deterministic.

## 9. Configuration & secrets

- `.env` (gitignored): `GEMINI_API_KEY=...`, optional `COACH_MODEL=gemini-2.5-flash`, optional `PORT=3001`.
- `.env.example` committed with placeholder values and a short setup note (get a free key from Google AI Studio).
- `README` gains an "AI Coach (optional)" section: how to get a free key, that the app runs without one, and the free-tier caveats (rate limits; only anonymous typing stats are sent).

## 10. Out of scope (later slices)

AI daily training plan, AI chat coach, adaptive difficulty auto-adjustment, mistake-pattern detection across many tests, keyboard heatmap, XP/gamification. The `CoachInput` contract and the server are structured so these layer on without rework.
