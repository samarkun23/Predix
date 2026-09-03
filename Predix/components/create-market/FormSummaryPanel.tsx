import type { Market, MarketCategory } from '@/lib/types'
import MarketCard from '@/components/home/MarketCard'

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
  const previewMarket: Market = {
    id: 'preview',
    category,
    question: question || 'Will ___ happen by ___?',
    yesProbability: 50,
    pooledUsd: parseFloat(liquidity) || 0,
    endsInDays: Number.isFinite(endsInDays) && endsInDays > 0 ? endsInDays : 0,
  }

  return (
    <div className="lg:sticky lg:top-20">
      <h2 className="section-head text-xs font-semibold uppercase tracking-[0.06em] text-text">
        LIVE_PREVIEW
      </h2>
      <div className="pointer-events-none mt-3">
        <MarketCard market={previewMarket} />
      </div>
    </div>
  )
}
