import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResultsScreen } from './ResultsScreen'
import type { Metrics } from '../../engine/metrics'

const metrics: Metrics = {
  grossWpm: 62, netWpm: 58, accuracy: 96, consistency: 81,
  correctCharacters: 290, incorrectCharacters: 12, backspaceCount: 5,
  mistypedLetters: { r: 5, t: 4, e: 3 },
  slowestWords: [{ word: 'experience', seconds: 2.8 }],
  timeline: [40, 52, 58, 60, 62],
}

describe('ResultsScreen', () => {
  it('shows the headline net WPM and accuracy', () => {
    render(<ResultsScreen metrics={metrics} mode="words" duration={60} sessions={[]} isBest={false} onRepeat={() => {}} onNewTest={() => {}} />)
    expect(screen.getByTestId('net-wpm')).toHaveTextContent('58')
    expect(screen.getByText(/96% accuracy/)).toBeInTheDocument()
  })

  it('shows a personal-best badge when isBest', () => {
    render(<ResultsScreen metrics={metrics} mode="words" duration={60} sessions={[]} isBest onRepeat={() => {}} onNewTest={() => {}} />)
    expect(screen.getByText(/personal best/i)).toBeInTheDocument()
  })

  it('fires callbacks for repeat and new test', async () => {
    const onRepeat = vi.fn(); const onNewTest = vi.fn()
    render(<ResultsScreen metrics={metrics} mode="words" duration={60} sessions={[]} isBest={false} onRepeat={onRepeat} onNewTest={onNewTest} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /repeat/i }))
    await user.click(screen.getByRole('button', { name: /new test/i }))
    expect(onRepeat).toHaveBeenCalled()
    expect(onNewTest).toHaveBeenCalled()
  })
})
