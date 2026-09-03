import Hero from '@/components/home/Hero'
import StatsStrip from '@/components/home/StatsStrip'
import MarketsSection from '@/components/home/MarketsSection'
import TrustStrip from '@/components/home/TrustStrip'
import { markets, stats, trustPoints } from '@/lib/data'

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsStrip stats={stats} />
      <MarketsSection markets={markets} />
      <TrustStrip points={trustPoints} />
    </>
  )
}
