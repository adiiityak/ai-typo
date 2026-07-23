import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DashboardScreen } from './DashboardScreen'
import type { TypingSession } from '../../storage/history'

function session(overrides: Partial<TypingSession>): TypingSession {
  return {
    id: Math.random().toString(), mode: 'words', durationSeconds: 60,
    grossWpm: 60, netWpm: 55, accuracy: 95, consistency: 80,
    correctCharacters: 100, incorrectCharacters: 5, backspaceCount: 2,
    completedAt: '2026-07-22T10:00:00.000Z', timeline: [], mistypedLetters: {},
    ...overrides,
  }
}

describe('DashboardScreen', () => {
  it('shows the empty state and fires onStartTest when there is no history', async () => {
    const onStartTest = vi.fn()
    render(<DashboardScreen sessions={[]} onStartTest={onStartTest} />)
    expect(screen.getByText(/take your first test/i)).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: /start a test/i }))
    expect(onStartTest).toHaveBeenCalledOnce()
  })

  it('renders stat labels and a formatted time-practiced value from history', () => {
    render(
      <DashboardScreen
        sessions={[
          session({ netWpm: 40, durationSeconds: 30, completedAt: '2026-07-22T10:00:00.000Z' }),
          session({ netWpm: 88, durationSeconds: 60, completedAt: '2026-07-23T10:00:00.000Z' }),
        ]}
        onStartTest={() => {}}
      />,
    )
    expect(screen.getByText(/best wpm/i)).toBeInTheDocument()
    expect(screen.getByText(/time practiced/i)).toBeInTheDocument()
    expect(screen.getByText('1m 30s')).toBeInTheDocument() // 30 + 60 = 90s
  })
})
