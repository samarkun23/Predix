'use client'

export type PositionTab = 'all' | 'open' | 'resolved'

const TABS: { value: PositionTab; label: string }[] = [
  { value: 'all', label: 'ALL' },
  { value: 'open', label: 'OPEN' },
  { value: 'resolved', label: 'RESOLVED' },
]

interface PositionsTabsProps {
  active: PositionTab
  onChange: (tab: PositionTab) => void
}

export default function PositionsTabs({ active, onChange }: PositionsTabsProps) {
  return (
    <div className="flex w-full gap-2">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`min-h-[40px] flex-1 rounded-sm border px-3 py-2 text-[11px] font-medium uppercase tracking-[0.06em] transition-colors ${
            active === tab.value
              ? 'border-cyan bg-cyan/10 text-cyan'
              : 'border-border text-textDim hover:text-text'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
