import type { Metrics } from '../../engine/metrics'
import type { Mode, Duration } from '../../engine/types'
import type { TypingSession } from '../../storage/history'
import { MetricGrid } from './MetricGrid'
import { WpmTimelineChart } from './WpmTimelineChart'
import { ErrorBreakdown } from './ErrorBreakdown'
import { HistoryList } from './HistoryList'

type Props = {
  metrics: Metrics
  mode: Mode
  duration: Duration
  sessions: TypingSession[]
  isBest: boolean
  onRepeat: () => void
  onNewTest: () => void
}

export function ResultsScreen({ metrics, mode, duration, sessions, isBest, onRepeat, onNewTest }: Props) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <div className="flex items-end gap-6">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted">net wpm</div>
          <div data-testid="net-wpm" className="font-mono text-7xl text-accent">{metrics.netWpm}</div>
        </div>
        <div className="pb-3 text-lg text-muted">{metrics.accuracy}% accuracy · {mode} · {duration}s</div>
        {isBest && (
          <span className="mb-4 ml-auto rounded-full bg-accent/20 px-3 py-1 text-sm text-accent-soft">
            ★ Personal best
          </span>
        )}
      </div>

      <MetricGrid metrics={metrics} />
      <WpmTimelineChart timeline={metrics.timeline} />
      <ErrorBreakdown metrics={metrics} />
      <HistoryList sessions={sessions} />

      <div className="flex gap-3">
        <button type="button" onClick={onRepeat}
          className="rounded-lg bg-accent px-5 py-2 text-white hover:bg-accent-soft">Repeat</button>
        <button type="button" onClick={onNewTest}
          className="rounded-lg bg-surface px-5 py-2 text-fg hover:text-accent-soft">New test</button>
      </div>
    </div>
  )
}
