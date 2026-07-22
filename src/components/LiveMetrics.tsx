type Props = {
  secondsLeft: number
  grossWpm: number
  accuracy: number
  showWpm: boolean
  onToggleWpm: () => void
}

export function LiveMetrics({ secondsLeft, grossWpm, accuracy, showWpm, onToggleWpm }: Props) {
  return (
    <div className="flex items-center gap-8 font-mono text-accent-soft">
      <span className="text-3xl tabular-nums">{secondsLeft}</span>
      {showWpm && (
        <>
          <span className="text-lg tabular-nums">{grossWpm} wpm</span>
          <span className="text-lg tabular-nums">{accuracy}%</span>
        </>
      )}
      <button
        type="button"
        onClick={onToggleWpm}
        className="ml-auto text-xs text-muted hover:text-fg"
      >
        {showWpm ? 'hide live wpm' : 'show live wpm'}
      </button>
    </div>
  )
}
