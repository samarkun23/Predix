import type { Stat } from '@/lib/types'
import StatCard from '@/components/ui/StatCard'

interface StatsStripProps {
  stats: Stat[]
}

export default function StatsStrip({ stats }: StatsStripProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </div>
    </section>
  )
}
