'use client'

import { useEffect, useState } from 'react'
import Hero from '@/components/home/Hero'
import StatsStrip from '@/components/home/StatsStrip'
import MarketsSection from '@/components/home/MarketsSection'
import TrustStrip from '@/components/home/TrustStrip'
import { markets as fallbackMarkets, stats as defaultStats, trustPoints } from '@/lib/data'
import { useWallet } from '@solana/wallet-adapter-react'
import { getProgram, getReadOnlyProgram } from '@/lib/anchor'

export default function HomePage() {
  const { publicKey, signTransaction, signAllTransactions } = useWallet()
  const [marketsList, setMarketsList] = useState<any[]>([])
  const [statsData, setStatsData] = useState(defaultStats)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        // Read-only program works for anyone without needing wallet connected
        const program =
          publicKey && signTransaction && signAllTransactions
            ? getProgram(publicKey, signTransaction, signAllTransactions)
            : getReadOnlyProgram()

        const allMarkets = await (program.account as any).market.all()

        if (allMarkets && allMarkets.length > 0) {
          setMarketsList(allMarkets)

          setStatsData([
            {
              id: 'tvl',
              label: 'TOTAL_VALUE_LOCKED',
              value: `$${(allMarkets.length * 15).toFixed(1)}+`,
              accent: 'green',
            },
            {
              id: 'markets',
              label: 'MARKETS_ON_CHAIN',
              value: String(allMarkets.length),
              accent: 'cyan',
            },
            {
              id: 'wallets',
              label: 'NETWORK_STATUS',
              value: 'SOLANA DEVNET',
              accent: 'pink',
            },
            {
              id: 'program',
              label: 'PROGRAM_ID',
              value: 'j3bfzTbouGfN1dUAcD81BpuzRKXt1jjqxJ86rk4ZybA',
              accent: 'purple',
            },
          ])
        } else {
          // If no on-chain markets deployed yet, show starter markets
          setMarketsList(fallbackMarkets)
        }
      } catch (error) {
        console.warn('Could not fetch on-chain markets, showing starter markets:', error)
        setMarketsList(fallbackMarkets)
      } finally {
        setLoading(false)
      }
    }

    fetchMarkets()
  }, [publicKey, signTransaction, signAllTransactions])

  return (
    <>
      <Hero />
      <StatsStrip stats={statsData} />
      {loading ? (
        <div className="flex flex-col justify-center items-center py-16 gap-3">
          <span className="h-2 w-2 rounded-full bg-cyan animate-pulse-dot" />
          <p className="text-textDim text-xs uppercase tracking-wider animate-pulse">
            Loading markets from blockchain...
          </p>
        </div>
      ) : (
        <MarketsSection markets={marketsList} />
      )}
      <TrustStrip points={trustPoints} />
    </>
  )
}
