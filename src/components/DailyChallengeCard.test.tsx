import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DailyChallengeCard } from './DailyChallengeCard'
import type { TypingSession } from '../storage/history'

function session(completedAt: string): TypingSession {
  return {
    id: completedAt, mode: 'words', durationSeconds: 60,
    grossWpm: 60, netWpm: 55, accuracy: 95, consistency: 80,
    correctCharacters: 100, incorrectCharacters: 5, backspaceCount: 2,
    completedAt, timeline: [], mistypedLetters: {},
  }
}

const TODAY = '2026-07-23'

describe('DailyChallengeCard', () => {
  it('shows in-progress goal text and the streak', () => {
    render(<DailyChallengeCard sessions={[session('2026-07-23T09:00:00.000Z')]} today={TODAY} />)
    expect(screen.getByText(/daily goal/i)).toBeInTheDocument()
    expect(screen.getByText(/1 \/ 3 tests/i)).toBeInTheDocument()
    expect(screen.getByText(/🔥/)).toBeInTheDocument()
  })

  it('shows a done state once the goal is met', () => {
    render(
      <DailyChallengeCard
        sessions={[
          session('2026-07-23T08:00:00.000Z'),
          session('2026-07-23T09:00:00.000Z'),
          session('2026-07-23T10:00:00.000Z'),
        ]}
        today={TODAY}
      />,
    )
    expect(screen.getByText(/done/i)).toBeInTheDocument()
  })
})
