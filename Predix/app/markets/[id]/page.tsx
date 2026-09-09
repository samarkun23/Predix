'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { getProgram } from '@/lib/anchor'
import MarketDetailView from '@/components/market-detail/MarketDetailView'
import { getPriceHistory, getRecentSwaps, getPoolState, getSentiment } from '@/lib/data'

export default function MarketPage() {
  const params = useParams()
  const { publicKey, signTransaction, signAllTransactions } = useWallet()
  
  const [market, setMarket] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [pool, setPool] = useState<any>(null)

  useEffect(() => {
    const fetchMarket = async () => {
      // Agar wallet connect nahi hai ya ID nahi hai, toh wait karo
      if (!params.id || !publicKey || !signTransaction || !signAllTransactions) {
        setLoading(false)
        return
      }

      try {
        const program = getProgram(publicKey, signTransaction, signAllTransactions)
        const marketPubkey = new PublicKey(params.id as string)
        
        //  1. Seedha Blockchain se real data fetch karo
        const account = await (program.account as any).market.fetch(marketPubkey)

        // vault balance
        const connection = program.provider.connection

        const vaultYesBalance = await connection.getTokenAccountBalance(account.vaultYes)
        const vaultNoBalance = await connection.getTokenAccountBalance(account.vaultNo)

        const yesReserves = Number(vaultYesBalance.value.amount) / 1_000_000
        const noReserves = Number(vaultNoBalance.value.amount) / 1_000_000

        // total tvl and price
        const totalTVL = yesReserves + noReserves
        const yesPrice = totalTVL > 0 ? (yesReserves / totalTVL) * 100 : 0
        const noPrice = totalTVL > 0 ? (noReserves / totalTVL) * 100 : 0

        //  2. Blockchain data ko tumhare 'Market' type ke format mein adapt karo
        const adaptedMarket = {
          id: params.id as string,
          question: account.question,
          category: 'crypto', // V1 mein on-chain category nahi hai, default 'crypto' rakho
          resolutionDate: new Date(account.resolutionTime.toNumber() * 1000).toISOString(),
          isResolved: account.isResolved,
          isDisputed: account.isDisputed,
          winningOutcome: account.winningOutcome,
          oracleSource: account.oracleSource,
          // Agar tumhare MarketDetailView mein aur fields chahiye (jaise volume), toh yahan dummy values daal sakte ho
          volume24h: 0,
          yesPrice: yesPrice,
          noPrice: noPrice,
        }

        const realPoolState = {
          yesReserves: yesReserves,
          noReserves: noReserves,
          totalTVL: totalTVL,
          swapFee: 0.003,
          yesPrice: yesPrice,
          noPrice: noPrice,
        }

        setMarket(adaptedMarket)
        setPool(realPoolState)
      } catch (error) {
        console.error('Failed to fetch market from blockchain:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMarket()
  }, [params.id, publicKey, signTransaction, signAllTransactions])

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <p className="text-xl text-textDim animate-pulse">Loading market from blockchain...</p>
      </div>
    )
  }

  // Not Found State (Agar blockchain par bhi ye ID nahi mili)
  if (!market) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-red">Market Not Found</h1>
        <a href="/" className="text-cyan hover:underline">← Back to Markets</a>
      </div>
    )
  }

  // ✅ Success State: Apna original MarketDetailView render karo!
  return (
    <MarketDetailView
      market={market}
      // V1 ke liye chart/swaps mock data use karenge, lekin 'market' prop 100% real on-chain data hai!
      priceHistory={getPriceHistory(market.id) || []}
      swaps={getRecentSwaps(market.id) || []}
      pool={pool || { yesReserves: 0, noReserves: 0, totalTVL: 0, swapFee: 0.003}}
      sentiment={{fearGreedScore: 50, signals: [], buyYesFlowPct: 50}}
    />
  )
}