import type { TypingSession } from '../storage/history'

export type TrendPoint = { index: number; netWpm: number; accuracy: number }

export type DashboardStats = {
  currentWpm: number
  bestWpm: number
  averageAccuracy: number
  totalTests: number
  totalSeconds: number
  streakDays: number
  weakLetters: { letter: string; count: number }[]
  series: TrendPoint[]
}

function dayKey(iso: string): string {
  return iso.slice(0, 10) // YYYY-MM-DD (UTC date from the stored ISO string)
}

export function practiceStreak(sessions: TypingSession[]): number {
  if (sessions.length === 0) return 0
  const dayKeys = new Set(sessions.map((s) => dayKey(s.completedAt)))
  const lastIso = sessions.reduce((max, s) => (s.completedAt > max ? s.completedAt : max), sessions[0].completedAt)
  let streak = 0
  const cursor = new Date(dayKey(lastIso) + 'T00:00:00Z')
  while (dayKeys.has(cursor.toISOString().slice(0, 10))) {
    streak++
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return streak
}

export function computeDashboardStats(sessions: TypingSession[]): DashboardStats {
  if (sessions.length === 0) {
    return {
      currentWpm: 0, bestWpm: 0, averageAccuracy: 0, totalTests: 0,
      totalSeconds: 0, streakDays: 0, weakLetters: [], series: [],
    }
  }

  const ordered = [...sessions].sort((a, b) => a.completedAt.localeCompare(b.completedAt))

  const currentWpm = ordered[ordered.length - 1].netWpm
  const bestWpm = ordered.reduce((max, s) => Math.max(max, s.netWpm), 0)
  const averageAccuracy = Math.round(ordered.reduce((sum, s) => sum + s.accuracy, 0) / ordered.length)
  const totalTests = ordered.length
  const totalSeconds = ordered.reduce((sum, s) => sum + s.durationSeconds, 0)

  const streakDays = practiceStreak(ordered)

  const agg: Record<string, number> = {}
  for (const s of ordered) {
    for (const [letter, count] of Object.entries(s.mistypedLetters)) {
      agg[letter] = (agg[letter] ?? 0) + count
    }
  }
  const weakLetters = Object.entries(agg)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([letter, count]) => ({ letter, count }))

  const series = ordered.map((s, i) => ({ index: i + 1, netWpm: s.netWpm, accuracy: s.accuracy }))

  return { currentWpm, bestWpm, averageAccuracy, totalTests, totalSeconds, streakDays, weakLetters, series }
}
