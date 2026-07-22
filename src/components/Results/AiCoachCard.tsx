import { useMemo } from 'react'
import { analyze } from '../../coach/analyze'
import type { CoachInput } from '../../coach/summary'

type Props = {
  coachInput: CoachInput
  onStartExercise?: () => void
}

export function AiCoachCard({ coachInput, onStartExercise }: Props) {
  const analysis = useMemo(() => analyze(coachInput), [coachInput])

  return (
    <div className="rounded-lg bg-surface p-4">
      <h3 className="mb-2 text-sm uppercase tracking-wide text-accent-soft">Coach</h3>
      <div className="space-y-2">
        <p><span className="text-correct">Strength: </span>{analysis.strength}</p>
        <p><span className="text-error">Weakness: </span>{analysis.weakness}</p>
        <p className="text-muted">{analysis.recommendation}</p>
        {onStartExercise && (
          <button
            type="button"
            onClick={onStartExercise}
            className="mt-2 rounded-lg bg-accent px-4 py-2 text-white hover:bg-accent-soft"
          >
            Start recommended exercise
          </button>
        )}
      </div>
    </div>
  )
}
