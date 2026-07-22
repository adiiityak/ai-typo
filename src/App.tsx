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

export default function App() {
  const [config, setConfig] = useState<TestConfig>({ mode: 'words', durationSeconds: 30 })
  const [view, setView] = useState<'test' | 'results'>('test')
  const [showWpm, setShowWpm] = useState(true)
  const [sessions, setSessions] = useState<TypingSession[]>(() => loadSessions())
  const [isBest, setIsBest] = useState(false)

  const engine = useTypingEngine(config)

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

  const repeat = useCallback(() => { setView('test'); engine.restart() }, [engine])
  const newTest = useCallback(() => { setView('test'); engine.restart() }, [engine])

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
      />
    )
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 p-6">
      <header className="flex items-center justify-between">
        <span className="font-mono text-lg text-accent">TypePilot</span>
        <ConfigBar
          mode={config.mode}
          duration={config.durationSeconds}
          disabled={engine.state.status === 'running'}
          onChange={(c) => setConfig({ mode: c.mode, durationSeconds: c.duration })}
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
        <button type="button" onClick={engine.restart}
          className="rounded-lg bg-surface px-4 py-2 text-sm text-muted hover:text-fg">
          Restart (↻)
        </button>
      </footer>
    </div>
  )
}
