import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TypingArea } from './TypingArea'
import { createEngine } from '../engine/keystroke'

describe('TypingArea', () => {
  it('renders each target character', () => {
    render(<TypingArea state={createEngine('hi')} onChar={() => {}} onBackspace={() => {}} />)
    expect(screen.getByTestId('char-0')).toHaveTextContent('h')
    expect(screen.getByTestId('char-1')).toHaveTextContent('i')
  })

  it('calls onChar for a typed letter and onBackspace for backspace', async () => {
    const onChar = vi.fn()
    const onBackspace = vi.fn()
    render(<TypingArea state={createEngine('hi')} onChar={onChar} onBackspace={onBackspace} />)
    const user = userEvent.setup()
    await user.keyboard('h')
    expect(onChar).toHaveBeenCalledWith('h')
    await user.keyboard('{Backspace}')
    expect(onBackspace).toHaveBeenCalled()
  })

  it('marks the character at the cursor as current', () => {
    const state = { ...createEngine('hi'), cursor: 1 }
    render(<TypingArea state={state} onChar={() => {}} onBackspace={() => {}} />)
    expect(screen.getByTestId('char-1').getAttribute('data-state')).toBe('current')
  })
})
