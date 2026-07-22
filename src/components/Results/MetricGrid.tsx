import type { Metrics } from '../../engine/metrics'

export function MetricGrid({ metrics }: { metrics: Metrics }) {
  const items = [
    { label: 'accuracy', value: `${metrics.accuracy}%` },
    { label: 'consistency', value: `${metrics.consistency}%` },
    { label: 'gross wpm', value: `${metrics.grossWpm}` },
    { label: 'errors', value: `${metrics.incorrectCharacters}` },
    { label: 'backspaces', value: `${metrics.backspaceCount}` },
  ]
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
      {items.map((it) => (
        <div key={it.label} className="rounded-lg bg-surface p-4">
          <div className="text-xs uppercase tracking-wide text-muted">{it.label}</div>
          <div className="mt-1 font-mono text-2xl tabular-nums">{it.value}</div>
        </div>
      ))}
    </div>
  )
}
