"use client"
import type { Market, PricePoint, Swap, PoolState } from '@/lib/types'
import TickerStrip from '@/components/market-detail/TickerStrip'
import PriceChart from '@/components/market-detail/PriceChart'
import PoolPanel from '@/components/market-detail/PoolPanel'
import SwapPanel from '@/components/market-detail/SwapPanel'
import RecentActivity from '@/components/market-detail/RecentActivity'
import SentimentPanel from '@/components/panels/SentimentPanel'
import type { SentimentData } from '@/lib/data'

interface MarketDetailViewProps {
  market: Market
  priceHistory: PricePoint[]
  swaps: Swap[]
  pool: PoolState
  sentiment: SentimentData
}

export default function MarketDetailView({
  market,
  priceHistory,
  swaps,
  pool,
  sentiment,
}: MarketDetailViewProps) {
  const yesPrice = pool.yesReserve && pool.noReserve ? pool.yesReserve / (pool.yesReserve + pool.noReserve) : 0.5
  const change24h = priceHistory[priceHistory.length - 1].price - priceHistory[0].price

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {/* DOM order matches the required mobile reading order:
          1) ticker strip  2) SwapPanel  3) chart
          4) PoolPanel     5) SentimentPanel  6) recent activity
          (desktop lg: grid re-positions these — see column/row classes below) */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-12 lg:gap-4">
        <div className="lg:col-span-12">
          <TickerStrip market={market} change24h={change24h} yesPrice={yesPrice} poolTVL = {pool.totalTVL || 0}/>
        </div>

        <div className="lg:col-start-8 lg:col-span-3 lg:row-start-3">
          <SwapPanel pool={pool} market={market} />
        </div>

        <div className="lg:col-start-1 lg:col-span-7 lg:row-start-2">
          <PriceChart data={priceHistory} />
        </div>

        <div className="lg:col-start-8 lg:col-span-3 lg:row-start-2">
          <PoolPanel pool={pool} market={market}/>
        </div>

        <div className="lg:col-start-11 lg:col-span-2 lg:row-start-2 lg:row-span-2">
          <SentimentPanel
            fearGreedScore={sentiment.fearGreedScore}
            signals={sentiment.signals}
            buyYesFlowPct={sentiment.buyYesFlowPct}
          />
        </div>

        <div className="lg:col-start-1 lg:col-span-7 lg:row-start-3">
          <RecentActivity swaps={swaps} />
        </div>
      </div>
    </div>
  )
}
