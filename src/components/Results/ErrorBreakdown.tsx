import type { Metrics } from '../../engine/metrics'

export function ErrorBreakdown({ metrics }: { metrics: Metrics }) {
  const letters = Object.entries(metrics.mistypedLetters).sort((a, b) => b[1] - a[1]).slice(0, 5)
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg bg-surface p-4">
        <h3 className="mb-2 text-sm text-muted">most mistyped letters</h3>
        {letters.length === 0 ? (
          <p className="text-muted">No mistakes — clean run.</p>
        ) : (
          <ul className="space-y-1 font-mono">
            {letters.map(([ch, n]) => (
              <li key={ch} className="flex justify-between">
                <span className="text-error">{ch === ' ' ? '␣' : ch}</span>
                <span className="text-muted">{n} errors</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="rounded-lg bg-surface p-4">
        <h3 className="mb-2 text-sm text-muted">slowest words</h3>
        <ul className="space-y-1 font-mono">
          {metrics.slowestWords.map((w) => (
            <li key={w.word} className="flex justify-between">
              <span>{w.word}</span>
              <span className="text-muted">{w.seconds.toFixed(1)}s</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
