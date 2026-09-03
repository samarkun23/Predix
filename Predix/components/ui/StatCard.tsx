import type { Stat } from '@/lib/types'

const ACCENT_TEXT: Record<NonNullable<Stat['accent']>, string> = {
  pink: 'text-pink',
  cyan: 'text-cyan',
  green: 'text-green',
  purple: 'text-purple',
}

interface StatCardProps {
  stat: Stat
}

export default function StatCard({ stat }: StatCardProps) {
  const accentClass = stat.accent ? ACCENT_TEXT[stat.accent] : 'text-text'
  return (
    <div className="rounded border border-border bg-bg2 px-4 py-4 sm:px-5 sm:py-5">
      <p className="text-[11px] uppercase tracking-[0.06em] text-textDim">{stat.label}</p>
      <p
        className={`mt-2 truncate text-lg font-semibold sm:text-xl ${accentClass}`}
        style={{ textShadow: '0 0 14px currentColor' }}
        title={stat.value}
      >
        {stat.value}
      </p>
    </div>
  )
}
