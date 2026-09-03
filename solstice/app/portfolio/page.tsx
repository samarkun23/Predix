'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { positions } from '@/lib/data'
import PortfolioSummary from '@/components/portfolio/PortfolioSummary'
import PositionsTabs, { type PositionTab } from '@/components/portfolio/PositionsTabs'
import PositionsTable from '@/components/portfolio/PositionsTable'
import PositionCardMobile from '@/components/portfolio/PositionCardMobile'
import Button from '@/components/ui/Button'

export default function PortfolioPage() {
  const [tab, setTab] = useState<PositionTab>('all')

  const filtered = useMemo(() => {
    if (tab === 'all') return positions
    if (tab === 'open') return positions.filter((p) => p.status === 'open')
    return positions.filter((p) => p.status !== 'open')
  }, [tab])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="section-head text-sm font-semibold uppercase tracking-[0.06em] text-text">
        PORTFOLIO
      </h1>

      <div className="mt-6">
        <PortfolioSummary positions={positions} />
      </div>

      <div className="mt-8">
        <PositionsTabs active={tab} onChange={setTab} />
      </div>

      <div className="mt-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded border border-border bg-bg2 py-16 text-center">
            <p className="text-sm text-textDim">&gt; NO_POSITIONS_FOUND</p>
            <Link href="/">
              <Button variant="primary">BROWSE_MARKETS</Button>
            </Link>
          </div>
        ) : (
          <>
            <PositionsTable positions={filtered} />
            <PositionCardMobile positions={filtered} />
          </>
        )}
      </div>
    </div>
  )
}
