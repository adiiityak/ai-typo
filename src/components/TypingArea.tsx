import { useEffect, useRef } from 'react'
import type { EngineState } from '../engine/types'

type Props = {
  state: EngineState
  onChar: (char: string) => void
  onBackspace: () => void
}

function charState(state: EngineState, index: number): 'correct' | 'incorrect' | 'current' | 'untyped' {
  if (index === state.cursor) return 'current'
  if (index < state.cursor) {
    // Forward-typing approximation for the live view; final metrics use the full event log.
    const typed = state.events[index]
    return typed && typed.isCorrect ? 'correct' : 'incorrect'
  }
  return 'untyped'
}

const CLASS: Record<string, string> = {
  correct: 'text-correct',
  incorrect: 'text-error underline decoration-error',
  current: 'text-fg bg-accent/30 rounded-sm',
  untyped: 'text-muted',
}

export function TypingArea({ state, onChar, onBackspace }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div
      className="relative cursor-text select-none"
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        aria-label="typing input"
        className="absolute opacity-0 -z-10 h-px w-px"
        autoFocus
        value=""
        onChange={() => {}}
        onKeyDown={(e) => {
          if (e.key === 'Backspace') {
            e.preventDefault()
            onBackspace()
          } else if (e.key.length === 1) {
            e.preventDefault()
            onChar(e.key)
          }
        }}
      />
      <p className="font-mono text-2xl leading-relaxed tracking-wide max-w-3xl">
        {state.target.split('').map((ch, i) => {
          const st = charState(state, i)
          return (
            <span key={i} data-testid={`char-${i}`} data-state={st} className={CLASS[st]}>
              {ch}
            </span>
          )
        })}
      </p>
    </div>
  )
}
