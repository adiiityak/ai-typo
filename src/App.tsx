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
import { buildCoachInput } from './coach/summary'
import { generatePassage } from './coach/passage'
import { Nav } from './components/Nav'
import { DashboardScreen } from './components/Dashboard/DashboardScreen'

export default function App() {
  const [config, setConfig] = useState<TestConfig>({ mode: 'words', durationSeconds: 30 })
  const [view, setView] = useState<'test' | 'results' | 'dashboard'>('test')
  const [showWpm, setShowWpm] = useState(true)
  const [sessions, setSessions] = useState<TypingSession[]>(() => loadSessions())
  const [isBest, setIsBest] = useState(false)
  const [customTarget, setCustomTarget] = useState<string | undefined>(undefined)

  const engine = useTypingEngine(config, customTarget)

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

  const repeat = useCallback(() => { setView('test'); engine.restart(true) }, [engine])
  const newTest = useCallback(() => { setCustomTarget(undefined); setView('test'); engine.restart(false) }, [engine])

  const navigate = useCallback((v: 'test' | 'dashboard') => {
    if (v === 'dashboard') setSessions(loadSessions())
    setView(v)
  }, [])

  const startExercise = useCallback(() => {
    if (!engine.metrics) return
    const input = buildCoachInput(engine.metrics, config.mode, config.durationSeconds, sessions)
    const { passage } = generatePassage(input)
    if (passage.trim()) { setCustomTarget(passage.trim()); setView('test') }
  }, [engine.metrics, config.mode, config.durationSeconds, sessions])

  if (view === 'dashboard') {
    return (
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 p-6">
        <Nav active="dashboard" onNavigate={navigate} />
        <DashboardScreen sessions={sessions} onStartTest={() => navigate('test')} />
      </div>
    )
  }

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
        onStartExercise={startExercise}
      />
    )
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 p-6">
      <Nav active="test" onNavigate={navigate} />
      <header className="flex items-center justify-end">
        <ConfigBar
          mode={config.mode}
          duration={config.durationSeconds}
          disabled={engine.state.status === 'running'}
          onChange={(c) => { setCustomTarget(undefined); setConfig({ mode: c.mode, durationSeconds: c.duration }) }}
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
        <button type="button" onClick={() => engine.restart()}
          className="rounded-lg bg-surface px-4 py-2 text-sm text-muted hover:text-fg">
          Restart (↻)
        </button>
      </footer>
    </div>
  )
}
