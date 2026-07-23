export type NavView = 'test' | 'dashboard'

const TABS: NavView[] = ['test', 'dashboard']

type Props = {
  active: NavView
  onNavigate: (v: NavView) => void
}

export function Nav({ active, onNavigate }: Props) {
  return (
    <nav className="flex items-center justify-between">
      <span className="font-mono text-lg text-accent">TypePilot</span>
      <div className="flex gap-1">
        {TABS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onNavigate(v)}
            aria-current={active === v ? 'page' : undefined}
            className={`px-3 py-1 rounded-md text-sm capitalize transition-colors ${
              active === v ? 'bg-accent text-white' : 'text-muted hover:text-fg'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </nav>
  )
}
