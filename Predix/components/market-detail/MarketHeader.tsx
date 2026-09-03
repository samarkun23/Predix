import type { Market } from '@/lib/types'
import Badge from '@/components/ui/Badge'
import { CATEGORY_BADGE_VARIANT, CATEGORY_LABEL } from '@/components/home/CategoryStyles'

interface MarketHeaderProps {
  market: Market
  change24h: number
}

export default function MarketHeader({ market, change24h }: MarketHeaderProps) {
  const isUp = change24h >= 0

  return (
    <div className="rounded border border-border bg-bg2 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={CATEGORY_BADGE_VARIANT[market.category]}>
          {CATEGORY_LABEL[market.category]}
        </Badge>
        <span className="text-[11px] uppercase tracking-[0.06em] text-textDim">
          ID · {market.id}
        </span>
      </div>

      <h1 className="mt-3 max-w-3xl text-lg font-semibold leading-snug text-text sm:text-xl">
        {market.question}
      </h1>

      <div className="no-scrollbar mt-4 flex gap-6 overflow-x-auto border-t border-border pt-4">
        <div className="shrink-0">
          <p className="text-[11px] uppercase tracking-[0.06em] text-textDim">YES_PRICE</p>
          <p
            className="mt-1 text-2xl font-bold text-green"
            style={{ textShadow: '0 0 14px currentColor' }}
          >
            {market.yesProbability}¢
          </p>
        </div>
        <div className="shrink-0">
          <p className="text-[11px] uppercase tracking-[0.06em] text-textDim">24H_CHANGE</p>
          <p className={`mt-1 text-2xl font-bold ${isUp ? 'text-green' : 'text-pink'}`}>
            {isUp ? '+' : ''}
            {change24h.toFixed(1)}%
          </p>
        </div>
        <div className="shrink-0">
          <p className="text-[11px] uppercase tracking-[0.06em] text-textDim">POOLED_VOLUME</p>
          <p className="mt-1 text-2xl font-bold text-text">
            ${(market.pooledUsd / 1000).toFixed(1)}K
          </p>
        </div>
        <div className="shrink-0">
          <p className="text-[11px] uppercase tracking-[0.06em] text-textDim">ENDS_IN</p>
          <p className="mt-1 text-2xl font-bold text-cyan">{market.endsInDays}D</p>
        </div>
      </div>
    </div>
  )
}
