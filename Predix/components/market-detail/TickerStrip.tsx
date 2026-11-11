interface TickerStripProps {
  market: any
  change24h: number
  yesPrice: number
  poolTVL: number
}

export default function TickerStrip({ market, change24h, yesPrice, poolTVL }: TickerStripProps) {
  const acc = market?.account || market
  const isResolved = acc?.isResolved ?? false
  const isDisputed = acc?.isDisputed ?? false

  const isUp = change24h >= 0

  const resolutionDate = market?.resolutionDate
  const endsInDays = resolutionDate
    ? Math.max(0, Math.round((new Date(resolutionDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : (market?.endsInDays ?? 0)

  // Status badge
  let statusBadge: React.ReactNode
  if (isDisputed) {
    statusBadge = (
      <span className="shrink-0 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wide bg-amber/10 text-amber border border-amber/30">
        DISPUTED
      </span>
    )
  } else if (isResolved) {
    const outcomeLabel =
      acc?.winningOutcome === 1 ? 'YES' : acc?.winningOutcome === 2 ? 'NO' : 'VOID'
    const outcomeColor =
      acc?.winningOutcome === 1
        ? 'bg-green/10 text-green border-green/30'
        : acc?.winningOutcome === 2
        ? 'bg-pink/10 text-pink border-pink/30'
        : 'bg-amber/10 text-amber border-amber/30'
    statusBadge = (
      <span className={`shrink-0 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wide border ${outcomeColor}`}>
        RESOLVED · {outcomeLabel}
      </span>
    )
  } else {
    statusBadge = (
      <span className="hidden shrink-0 items-center gap-1.5 text-[11px] uppercase tracking-[0.06em] text-green sm:flex">
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-green" />
        LIVE
      </span>
    )
  }

  return (
    <div className="rounded border border-border bg-bg2 px-4 py-3 sm:px-5 sm:py-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-text sm:text-base">
          {market?.question ?? acc?.question}
        </h1>
        {statusBadge}
      </div>

      <div className="no-scrollbar mt-3 flex gap-6 overflow-x-auto">
        <div className="shrink-0">
          <p className="text-[11px] uppercase tracking-[0.06em] text-textDim">YES_PRICE</p>
          <p
            className="mt-0.5 text-xl font-bold text-green sm:text-2xl"
            style={{ textShadow: '0 0 14px currentColor' }}
          >
            {yesPrice.toFixed(0)}¢
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
            ${(poolTVL / 1000).toFixed(2)}K
          </p>
        </div>
        <div className="shrink-0">
          <p className="text-[11px] uppercase tracking-[0.06em] text-textDim">
            {isResolved ? 'RESOLVED' : 'ENDS'}
          </p>
          <p className={`mt-0.5 text-xl font-bold sm:text-2xl ${isResolved ? 'text-textDim' : 'text-cyan'}`}>
            {isResolved ? '—' : `${endsInDays}D`}
          </p>
        </div>
      </div>
    </div>
  )
}
