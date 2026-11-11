import type { MarketCategory } from '@/lib/types'

interface FormSummaryPanelProps {
  question: string
  category: MarketCategory
  liquidity: string
  endsInDays: number
}

export default function FormSummaryPanel({
  question,
  category,
  liquidity,
  endsInDays,
}: FormSummaryPanelProps) {
  const pooledUsd = parseFloat(liquidity) || 0
  const daysLeft = Number.isFinite(endsInDays) && endsInDays > 0 ? endsInDays : 0

  const categoryColor: Record<MarketCategory, string> = {
    crypto: 'bg-cyan/10 text-cyan border-cyan/30',
    politics: 'bg-purple/10 text-purple border-purple/30',
    sports: 'bg-green/10 text-green border-green/30',
    other: 'bg-textDim/10 text-textDim border-border',
  }

  return (
    <div className="lg:sticky lg:top-20">
      <h2 className="section-head text-xs font-semibold uppercase tracking-[0.06em] text-text">
        LIVE_PREVIEW
      </h2>
      <div className="mt-3 rounded-xl border border-border bg-bg/50 p-6 flex flex-col gap-3 pointer-events-none">
        {/* Category + days */}
        <div className="flex items-center justify-between">
          <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase border ${categoryColor[category]}`}>
            {category}
          </span>
          <span className="text-xs text-textDim">{daysLeft}d left</span>
        </div>

        {/* Question */}
        <p className="text-base font-bold text-white leading-snug">
          {question || 'Will ___ happen by ___?'}
        </p>

        {/* Pool */}
        <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-textDim">
          <span>Pool</span>
          <span className="text-text font-medium">${pooledUsd.toLocaleString()} USDC</span>
        </div>

        {/* Probability bar */}
        <div>
          <div className="flex justify-between text-[10px] text-textDim mb-1">
            <span className="text-green">YES 50%</span>
            <span className="text-pink">NO 50%</span>
          </div>
          <div className="flex h-1.5 rounded-full overflow-hidden">
            <div className="bg-green" style={{ width: '50%' }} />
            <div className="bg-pink" style={{ width: '50%' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
