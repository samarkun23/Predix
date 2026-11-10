'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddressSync } from '@solana/spl-token'
import { getProgram } from '@/lib/anchor'
import MarketDetailView from '@/components/market-detail/MarketDetailView'
import { getPriceHistory, getRecentSwaps, getSentiment } from '@/lib/data'

const SAFE_PROGRAM_ID = new PublicKey('j3bfzTbouGfN1dUAcD81BpuzRKXt1jjqxJ86rk4ZybA')

export default function MarketPage() {
  const params = useParams()
  const { publicKey, signTransaction, signAllTransactions } = useWallet()

  const [market, setMarket] = useState<any>(null)
  const [pool, setPool] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchMarket = useCallback(async () => {
    if (!params.id || !publicKey || !signTransaction || !signAllTransactions) {
      setLoading(false)
      return
    }

    try {
      const program = getProgram(publicKey, signTransaction, signAllTransactions)
      const marketPubkey = new PublicKey(params.id as string)

      // Fetch on-chain account data
      const account = await (program.account as any).market.fetch(marketPubkey)

      // Fetch vault balances directly (vault authority PDA → ATA)
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
      const vaultAuthority = PublicKey.findProgramAddressSync(
        [Buffer.from('vault'), marketPubkey.toBuffer()],
        SAFE_PROGRAM_ID
      )[0]

      const yesMint = new PublicKey(account.outcomeYesMint)
      const noMint = new PublicKey(account.outcomeNoMint)

      const vaultYesAta = getAssociatedTokenAddressSync(yesMint, vaultAuthority, true)
      const vaultNoAta = getAssociatedTokenAddressSync(noMint, vaultAuthority, true)

      let yesReserves = 0
      let noReserves = 0

      try {
        const yesBalance = await connection.getTokenAccountBalance(vaultYesAta)
        yesReserves = Number(yesBalance.value.amount) / 1_000_000
      } catch (_) {}

      try {
        const noBalance = await connection.getTokenAccountBalance(vaultNoAta)
        noReserves = Number(noBalance.value.amount) / 1_000_000
      } catch (_) {}

      const totalTVL = yesReserves + noReserves

      // Correct CPMM pricing: YES price = noReserve / total
      const yesPrice = totalTVL > 0 ? (noReserves / totalTVL) * 100 : 50

      const adaptedMarket = {
        id: params.id as string,
        account,
        question: account.question,
        category: 'crypto',
        resolutionDate: new Date(account.resolutionTime.toNumber() * 1000).toISOString(),
        isResolved: account.isResolved,
        isDisputed: account.isDisputed,
        winningOutcome: account.winningOutcome,
        oracleSource: account.oracleSource,
        yesPrice,
        noPrice: 100 - yesPrice,
        volume24h: 0,
      }

      const realPoolState = {
        yesReserve: yesReserves,   // PoolState field names (singular)
        noReserve: noReserves,
        totalTVL,
        feeBps: 30,
        lpProviders: 0,
      }

      setMarket(adaptedMarket)
      setPool(realPoolState)
    } catch (error) {
      console.error('Failed to fetch market from blockchain:', error)
    } finally {
      setLoading(false)
    }
  }, [params.id, publicKey, signTransaction, signAllTransactions])

  useEffect(() => {
    fetchMarket()
  }, [fetchMarket])

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-cyan animate-pulse-dot" />
          <p className="text-sm text-textDim animate-pulse">Loading market from blockchain...</p>
        </div>
      </div>
    )
  }

  // ── Wallet not connected ──
  if (!publicKey) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center gap-4">
        <p className="text-textDim text-sm">Connect your wallet to view this market.</p>
      </div>
    )
  }

  // ── Not found ──
  if (!market) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-red">Market Not Found</h1>
        <a href="/" className="text-cyan hover:underline text-sm">← Back to Markets</a>
      </div>
    )
  }

  return (
    <MarketDetailView
      market={market}
      priceHistory={getPriceHistory(market.id, market.yesPrice) || []}
      swaps={getRecentSwaps(market.id, market.yesPrice) || []}
      pool={pool || { yesReserve: 0, noReserve: 0, totalTVL: 0, feeBps: 30, lpProviders: 0 }}
      sentiment={getSentiment(market.id) || { fearGreedScore: 50, signals: [], buyYesFlowPct: 50 }}
      onRefresh={fetchMarket}
    />
  )
}