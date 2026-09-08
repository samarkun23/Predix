import type { Market } from '@/lib/types'

interface TickerStripProps {
  market: Market
  change24h: number
}

export default function TickerStrip({ market, change24h }: TickerStripProps) {
  const isUp = change24h >= 0

  return (
    <div className="rounded border border-border bg-bg2 px-4 py-3 sm:px-5 sm:py-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-text sm:text-base">
          {market.question}
        </h1>
        <span className="hidden shrink-0 items-center gap-1.5 text-[11px] uppercase tracking-[0.06em] text-green sm:flex">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-green" />
          LIVE
        </span>
      </div>

      <div className="no-scrollbar mt-3 flex gap-6 overflow-x-auto">
        <div className="shrink-0">
          <p className="text-[11px] uppercase tracking-[0.06em] text-textDim">YES_PRICE</p>
          <p
            className="mt-0.5 text-xl font-bold text-green sm:text-2xl"
            style={{ textShadow: '0 0 14px currentColor' }}
          >
            {market.yesProbability}¢
          </p>
        </div>
        <div className="shrink-0">
          <p className="text-[11px] uppercase tracking-[0.06em] text-textDim">24H_CHG</p>
          <p className={`mt-0.5 text-xl font-bold sm:text-2xl ${isUp ? 'text-green' : 'text-pink'}`}>
            {isUp ? '+' : ''}
            {change24h.toFixed(1)}%
          </p>
        </div>
        <div className="shrink-0">
          <p className="text-[11px] uppercase tracking-[0.06em] text-textDim">POOL_TVL</p>
          <p className="mt-0.5 text-xl font-bold text-text sm:text-2xl">
            ${(market.pooledUsd / 1000).toFixed(2)}K
          </p>
        </div>
        <div className="shrink-0">
          <p className="text-[11px] uppercase tracking-[0.06em] text-textDim">ENDS</p>
          <p className="mt-0.5 text-xl font-bold text-cyan sm:text-2xl">{market.endsInDays}D</p>
        </div>
      </div>
    </div>
  )
}
