import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AiCoachCard } from './AiCoachCard'
import type { CoachInput } from '../../coach/summary'

const punctInput: CoachInput = {
  netWpm: 65, grossWpm: 68, accuracy: 94, consistency: 82,
  weakLetters: [',', '.'], slowestWords: ['through'],
  backspaceCount: 4, recentAverageWpm: 50, mode: 'quotes', durationSeconds: 60,
}

describe('AiCoachCard', () => {
  it('renders a strength, a punctuation weakness, and a recommendation', () => {
    render(<AiCoachCard coachInput={punctInput} />)
    expect(screen.getByText(/strength/i)).toBeInTheDocument()
    expect(screen.getByText(/drops around punctuation/i)).toBeInTheDocument()
    expect(screen.getByText(/commas and periods/i)).toBeInTheDocument()
  })

  it('fires onStartExercise when the button is clicked', async () => {
    const onStart = vi.fn()
    render(<AiCoachCard coachInput={punctInput} onStartExercise={onStart} />)
    await userEvent.setup().click(screen.getByRole('button', { name: /start recommended exercise/i }))
    expect(onStart).toHaveBeenCalledOnce()
  })

  it('omits the button when no handler is provided', () => {
    render(<AiCoachCard coachInput={punctInput} />)
    expect(screen.queryByRole('button', { name: /start recommended exercise/i })).toBeNull()
  })
})
