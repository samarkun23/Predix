import type { Position, Stat } from '@/lib/types'
import StatCard from '@/components/ui/StatCard'
import { totalPortfolioValue, totalUnrealizedPnl, winRate } from '@/lib/portfolio'

interface PortfolioSummaryProps {
  positions: Position[]
}

export default function PortfolioSummary({ positions }: PortfolioSummaryProps) {
  const value = totalPortfolioValue(positions)
  const pnl = totalUnrealizedPnl(positions)
  const openCount = positions.filter((p) => p.status === 'open').length
  const rate = winRate(positions)

  const stats: Stat[] = [
    { id: 'value', label: 'PORTFOLIO_VALUE', value: `$${value.toFixed(2)}`, accent: 'cyan' },
    {
      id: 'pnl',
      label: 'UNREALIZED_PNL',
      value: `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`,
      accent: pnl >= 0 ? 'green' : 'pink',
    },
    { id: 'open', label: 'OPEN_POSITIONS', value: String(openCount), accent: 'purple' },
    { id: 'winrate', label: 'WIN_RATE', value: `${rate}%`, accent: 'green' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.id} stat={stat} />
      ))}
    </div>
  )
}
