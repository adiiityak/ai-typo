import { computeDashboardStats } from '../../dashboard/stats'
import type { TypingSession } from '../../storage/history'
import { StatCards } from './StatCards'
import { TrendChart } from './TrendChart'
import { WeakAreas } from './WeakAreas'
import { HistoryList } from '../Results/HistoryList'

type Props = {
  sessions: TypingSession[]
  onStartTest: () => void
}

export function DashboardScreen({ sessions, onStartTest }: Props) {
  if (sessions.length === 0) {
    return (
      <div className="mx-auto max-w-4xl p-6 text-center">
        <p className="mb-4 text-muted">Take your first test to see your progress here.</p>
        <button
          type="button"
          onClick={onStartTest}
          className="rounded-lg bg-accent px-5 py-2 text-white hover:bg-accent-soft"
        >
          Start a test
        </button>
      </div>
    )
  }

  const stats = computeDashboardStats(sessions)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <StatCards stats={stats} />
      <TrendChart series={stats.series} />
      <div className="grid gap-4 sm:grid-cols-2">
        <WeakAreas weakLetters={stats.weakLetters} />
        <HistoryList sessions={sessions} limit={10} />
      </div>
    </div>
  )
}
