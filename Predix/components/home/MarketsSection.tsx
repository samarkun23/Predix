'use client'

import { useState } from 'react'
import type { Market, MarketCategory } from '@/lib/types'
import MarketCard from '@/components/home/MarketCard'

interface MarketsSectionProps {
  markets: Market[]
}

type TabValue = 'all' | MarketCategory

const TABS: { value: TabValue; label: string }[] = [
  { value: 'all', label: 'ALL' },
  { value: 'crypto', label: 'CRYPTO' },
  { value: 'politics', label: 'POLITICS' },
  { value: 'sports', label: 'SPORTS' },
]

export default function MarketsSection({ markets }: MarketsSectionProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('all')

  const filtered =
    activeTab === 'all' ? markets : markets.filter((m) => m.category === activeTab)

  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="section-head text-sm font-semibold uppercase tracking-[0.06em] text-text">
          LIVE_MARKETS
        </h2>

        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`min-h-[40px] shrink-0 rounded-sm border px-3 py-2 text-[11px] font-medium uppercase tracking-[0.06em] transition-colors ${
                activeTab === tab.value
                  ? 'border-cyan bg-cyan/10 text-cyan'
                  : 'border-border text-textDim hover:text-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((market) => (
          <MarketCard key={market.id} market={market} />
        ))}
      </div>
    </section>
  )
}
