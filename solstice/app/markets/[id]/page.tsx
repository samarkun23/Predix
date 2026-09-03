import { notFound } from 'next/navigation'
import { getMarketById, priceHistory, recentTrades, orderBookAsks, orderBookBids } from '@/lib/data'
import MarketDetailView from '@/components/market-detail/MarketDetailView'

interface MarketPageProps {
  params: { id: string }
}

export default function MarketPage({ params }: MarketPageProps) {
  const market = getMarketById(params.id)

  if (!market) {
    notFound()
  }

  return (
    <MarketDetailView
      market={market}
      priceHistory={priceHistory}
      trades={recentTrades}
      asks={orderBookAsks}
      bids={orderBookBids}
    />
  )
}
