import type { DashboardStats } from '../../dashboard/stats'

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

export function StatCards({ stats }: { stats: DashboardStats }) {
  const items = [
    { label: 'current wpm', value: `${stats.currentWpm}` },
    { label: 'best wpm', value: `${stats.bestWpm}` },
    { label: 'avg accuracy', value: `${stats.averageAccuracy}%` },
    { label: 'streak', value: `🔥 ${stats.streakDays}d` },
    { label: 'total tests', value: `${stats.totalTests}` },
    { label: 'time practiced', value: formatDuration(stats.totalSeconds) },
  ]
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((it) => (
        <div key={it.label} className="rounded-lg bg-surface p-4">
          <div className="text-xs uppercase tracking-wide text-muted">{it.label}</div>
          <div className="mt-1 font-mono text-2xl tabular-nums">{it.value}</div>
        </div>
      ))}
    </div>
  )
}
