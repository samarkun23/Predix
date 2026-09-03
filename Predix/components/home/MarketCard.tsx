import Link from 'next/link'
import type { Market } from '@/lib/types'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ProbabilityBar from '@/components/home/ProbabilityBar'
import { CATEGORY_BADGE_VARIANT, CATEGORY_LABEL } from '@/components/home/CategoryStyles'

interface MarketCardProps {
  market: Market
}

export default function MarketCard({ market }: MarketCardProps) {
  const yesPrice = market.yesProbability
  const noPrice = 100 - market.yesProbability

  return (
    <div className="group flex flex-col gap-4 rounded border-t-2 border-t-purple border-x border-b border-border bg-panel p-4 transition-colors hover:border-borderStrong hover:bg-panelStrong sm:p-5">
      <Link href={`/markets/${market.id}`} className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <Badge variant={CATEGORY_BADGE_VARIANT[market.category]}>
            {CATEGORY_LABEL[market.category]}
          </Badge>
          <span className="text-lg font-semibold text-green" style={{ textShadow: '0 0 14px currentColor' }}>
            {yesPrice}%
          </span>
        </div>

        <p className="min-h-[2.75rem] text-sm leading-snug text-text">{market.question}</p>

        <ProbabilityBar yesProbability={market.yesProbability} />
      </Link>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="yes" className="w-full">
          YES · {yesPrice}¢
        </Button>
        <Button variant="no" className="w-full">
          NO · {noPrice}¢
        </Button>
      </div>

      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.04em] text-textDim">
        <span>POOL · ${(market.pooledUsd / 1000).toFixed(1)}K</span>
        <span>{market.endsInDays}D_LEFT</span>
      </div>
    </div>
  )
}
