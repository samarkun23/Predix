import type { Market, PricePoint, Trade, OrderBookRow } from '@/lib/types'
import MarketHeader from '@/components/market-detail/MarketHeader'
import PriceChart from '@/components/market-detail/PriceChart'
import OrderBook from '@/components/market-detail/OrderBook'
import BuyPanel from '@/components/market-detail/BuyPanel'
import SentimentPanel from '@/components/market-detail/SentimentPanel'
import RecentActivity from '@/components/market-detail/RecentActivity'

interface MarketDetailViewProps {
  market: Market
  priceHistory: PricePoint[]
  trades: Trade[]
  asks: OrderBookRow[]
  bids: OrderBookRow[]
}

export default function MarketDetailView({
  market,
  priceHistory,
  trades,
  asks,
  bids,
}: MarketDetailViewProps) {
  const change24h = priceHistory[priceHistory.length - 1].price - priceHistory[0].price

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {/* DOM order below matches the required mobile reading order:
          1) header/ticker  2) buy panel  3) chart  4) order book
          5) sentiment      6) recent activity                    */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-12 lg:gap-4">
        <div className="lg:col-span-12">
          <MarketHeader market={market} change24h={change24h} />
        </div>

        <div className="lg:col-start-11 lg:col-span-2 lg:row-start-2">
          <BuyPanel yesProbability={market.yesProbability} />
        </div>

        <div className="lg:col-start-1 lg:col-span-7 lg:row-start-2">
          <PriceChart data={priceHistory} />
        </div>

        <div className="lg:col-start-8 lg:col-span-3 lg:row-start-2 lg:row-span-2">
          <OrderBook asks={asks} bids={bids} />
        </div>

        <div className="lg:col-start-11 lg:col-span-2 lg:row-start-3">
          <SentimentPanel yesProbability={market.yesProbability} />
        </div>

        <div className="lg:col-start-1 lg:col-span-7 lg:row-start-3">
          <RecentActivity trades={trades} />
        </div>
      </div>
    </div>
  )
}
