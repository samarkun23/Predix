"use client"
import type { PricePoint, Swap, PoolState } from '@/lib/types'
import TickerStrip from '@/components/market-detail/TickerStrip'
import PriceChart from '@/components/market-detail/PriceChart'
import PoolPanel from '@/components/market-detail/PoolPanel'
import SwapPanel from '@/components/market-detail/SwapPanel'
import RecentActivity from '@/components/market-detail/RecentActivity'
import SentimentPanel from '@/components/panels/SentimentPanel'
import ResolveMarketPanel from '@/components/market-detail/ResolveMarketPanel'
import DisputeBanner from '@/components/market-detail/DisputeBanner'
import RedeemPanel from '@/components/market-detail/RedeemPanel'
import type { SentimentData } from '@/lib/data'

interface MarketDetailViewProps {
  market: any
  priceHistory: PricePoint[]
  swaps: Swap[]
  pool: PoolState
  sentiment: SentimentData
  onRefresh: () => void
}

export default function MarketDetailView({
  market,
  priceHistory,
  swaps,
  pool,
  sentiment,
  onRefresh,
}: MarketDetailViewProps) {
  const acc = market?.account || market

  // Use correct CPMM formula: YES price = noReserve / (yesReserve + noReserve)
  const yesReserve = pool.yesReserve ?? 0
  const noReserve = pool.noReserve ?? 0
  const total = yesReserve + noReserve
  const yesPrice = total > 0 ? (noReserve / total) * 100 : 50

  const change24h =
    priceHistory.length >= 2
      ? priceHistory[priceHistory.length - 1].price - priceHistory[0].price
      : 0

  const isResolved = acc?.isResolved ?? false
  const isDisputed = acc?.isDisputed ?? false

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">

      {/* ── Lifecycle banners — full width, stacked above the grid ── */}
      <div className="mb-4 flex flex-col gap-3">

        {/* 1. Oracle / admin resolve panel (only visible to oracle or admin) */}
        <ResolveMarketPanel market={market} onResolved={onRefresh} />

        {/* 2. Dispute window countdown (visible to everyone while window is open) */}
        <DisputeBanner market={market} onDisputed={onRefresh} />

      </div>

      {/* ── Main layout grid ── */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-12 lg:gap-4">

        {/* Ticker strip — always visible */}
        <div className="lg:col-span-12">
          <TickerStrip market={market} change24h={change24h} yesPrice={yesPrice} poolTVL={pool.totalTVL || 0} />
        </div>

        {/* Right column: swap / redeem / pool */}
        <div className="flex flex-col gap-4 lg:col-start-8 lg:col-span-3 lg:row-start-2 lg:row-span-2">

          {/* Redeem panel takes over the right column once market is resolved & window closed */}
          {isResolved ? (
            <RedeemPanel market={market} onRedeemed={onRefresh} />
          ) : (
            <SwapPanel pool={pool} market={market} />
          )}

          <PoolPanel pool={pool} market={market} />
        </div>

        {/* Price chart */}
        <div className="lg:col-start-1 lg:col-span-7 lg:row-start-2">
          <PriceChart data={priceHistory} currentPrice={yesPrice} marketId={market.id} />
        </div>

        {/* Sentiment panel */}
        <div className="lg:col-start-11 lg:col-span-2 lg:row-start-2 lg:row-span-2">
          <SentimentPanel
            fearGreedScore={sentiment.fearGreedScore}
            signals={sentiment.signals}
            buyYesFlowPct={sentiment.buyYesFlowPct}
          />
        </div>

        {/* Recent activity */}
        <div className="lg:col-start-1 lg:col-span-7 lg:row-start-3">
          <RecentActivity swaps={swaps} />
        </div>

      </div>
    </div>
  )
}
