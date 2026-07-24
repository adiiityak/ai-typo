import type { TypingSession } from '../storage/history'
import { practiceStreak } from '../dashboard/stats'

export const DAILY_GOAL_TESTS = 3

export type DailyChallenge = {
  goalTests: number
  completedToday: number
  done: boolean
  bestAccuracyToday: number | null
  streakDays: number
}

export function computeDailyChallenge(sessions: TypingSession[], todayKey: string): DailyChallenge {
  const todays = sessions.filter((s) => s.completedAt.slice(0, 10) === todayKey)
  const completedToday = todays.length
  const bestAccuracyToday = todays.length ? Math.max(...todays.map((s) => s.accuracy)) : null
  return {
    goalTests: DAILY_GOAL_TESTS,
    completedToday,
    done: completedToday >= DAILY_GOAL_TESTS,
    bestAccuracyToday,
    streakDays: practiceStreak(sessions),
  }
}
