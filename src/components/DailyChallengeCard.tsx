import { computeDailyChallenge } from '../challenge/daily'
import type { TypingSession } from '../storage/history'

type Props = {
  sessions: TypingSession[]
  today: string
}

export function DailyChallengeCard({ sessions, today }: Props) {
  const c = computeDailyChallenge(sessions, today)
  const pct = Math.min(100, Math.round((c.completedToday / c.goalTests) * 100))

  return (
    <div className="flex items-center gap-4 rounded-lg bg-surface px-4 py-3">
      <span className="text-sm text-muted">Daily goal</span>
      <div className="h-2 flex-1 rounded-full bg-muted/30">
        <div className="h-2 rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-sm tabular-nums">
        {c.done ? '✓ done' : `${c.completedToday} / ${c.goalTests} tests`}
      </span>
      <span className="font-mono text-sm text-accent-soft">🔥 {c.streakDays}d</span>
    </div>
  )
}
