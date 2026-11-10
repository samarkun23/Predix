'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { getProgram, getReadOnlyProgram, connection } from '@/lib/anchor'
import type { Position } from '@/lib/types'
import { positions as fallbackPositions } from '@/lib/data'
import { getUserPositions } from '@/lib/portfolioStorage'
import PortfolioSummary from '@/components/portfolio/PortfolioSummary'
import PositionsTabs, { type PositionTab } from '@/components/portfolio/PositionsTabs'
import PositionsTable from '@/components/portfolio/PositionsTable'
import PositionCardMobile from '@/components/portfolio/PositionCardMobile'
import Button from '@/components/ui/Button'

export default function PortfolioPage() {
  const { publicKey, signTransaction, signAllTransactions } = useWallet()

  const [tab, setTab] = useState<PositionTab>('all')
  const [loading, setLoading] = useState<boolean>(true)
  const [onChainPositions, setOnChainPositions] = useState<Position[]>([])
  const [showDemoToggle, setShowDemoToggle] = useState<boolean>(false)

  const fetchOnChainPositions = useCallback(async () => {
    if (!publicKey) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // 1. First, retrieve locally stored/closed positions
      const storedPositions = getUserPositions(publicKey.toBase58())

      // 2. Query ALL user's token accounts in ONE single RPC call (fast, no rate limiting)
      const tokenAccountsPromise = connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: TOKEN_PROGRAM_ID,
      }).catch((err) => {
        console.warn('Could not fetch parsed token accounts:', err)
        return { value: [] }
      })

      // 3. Query all on-chain markets
      const program =
        signTransaction && signAllTransactions
          ? getProgram(publicKey, signTransaction, signAllTransactions)
          : getReadOnlyProgram()

      const allMarketsPromise = (program.account as any).market.all().catch((err: any) => {
        console.warn('Could not fetch on-chain markets:', err)
        return []
      })

      const [tokenAccounts, allMarkets] = await Promise.all([
        tokenAccountsPromise,
        allMarketsPromise,
      ])

      // Map mint address -> balance
      const userBalances = new Map<string, number>()
      for (const item of tokenAccounts.value) {
        const info = item.account.data.parsed.info
        const mint = info.mint
        const amount = Number(info.tokenAmount.uiAmount || 0)
        userBalances.set(mint, amount)
      }

      const activePositions: Position[] = []

      // Match balances against all on-chain markets
      for (const m of allMarkets) {
        const acc = m.account
        const marketPubkey = m.publicKey.toBase58()
        const question = acc.question || 'Prediction Market'

        const yesMintStr = new PublicKey(acc.outcomeYesMint).toBase58()
        const noMintStr = new PublicKey(acc.outcomeNoMint).toBase58()

        const yesShares = userBalances.get(yesMintStr) || 0
        const noShares = userBalances.get(noMintStr) || 0

        const isResolved = acc.isResolved
        const winningOutcome = acc.winningOutcome

        // Process YES position if balance > 0
        if (yesShares > 0.001) {
          let status: Position['status'] = 'open'
          let currentPrice = 50

          if (isResolved) {
            if (winningOutcome === 1) {
              status = 'resolved-won'
              currentPrice = 100
            } else if (winningOutcome === 3) {
              status = 'resolved-won' // Void / Refund
              currentPrice = 50
            } else {
              status = 'resolved-lost'
              currentPrice = 0
            }
          }

          const sizeUsd = Math.round(yesShares * (currentPrice / 100) * 100) / 100
          activePositions.push({
            id: `${marketPubkey}-yes`,
            marketId: marketPubkey,
            marketQuestion: question,
            side: 'yes',
            entryPrice: 50.0,
            currentPrice,
            sizeUsd,
            shares: yesShares,
            status,
          })
        }

        // Process NO position if balance > 0
        if (noShares > 0.001) {
          let status: Position['status'] = 'open'
          let currentPrice = 50

          if (isResolved) {
            if (winningOutcome === 2) {
              status = 'resolved-won'
              currentPrice = 100
            } else if (winningOutcome === 3) {
              status = 'resolved-won' // Void / Refund
              currentPrice = 50
            } else {
              status = 'resolved-lost'
              currentPrice = 0
            }
          }

          const sizeUsd = Math.round(noShares * (currentPrice / 100) * 100) / 100
          activePositions.push({
            id: `${marketPubkey}-no`,
            marketId: marketPubkey,
            marketQuestion: question,
            side: 'no',
            entryPrice: 50.0,
            currentPrice,
            sizeUsd,
            shares: noShares,
            status,
          })
        }
      }

      // Merge on-chain active positions with stored historical/closed positions
      const combined = [...activePositions]
      for (const sp of storedPositions) {
        // If not already in combined active list, include it (especially closed/resolved ones!)
        if (!combined.some((p) => p.id === sp.id)) {
          combined.push(sp)
        }
      }

      setOnChainPositions(combined)
    } catch (err) {
      console.error('Error fetching portfolio:', err)
    } finally {
      setLoading(false)
    }
  }, [publicKey, signTransaction, signAllTransactions])

  useEffect(() => {
    fetchOnChainPositions()
  }, [fetchOnChainPositions])

  // If user has no on-chain positions yet, display demo positions so page is rich and usable
  const effectivePositions = useMemo(() => {
    if (showDemoToggle) return fallbackPositions
    if (onChainPositions.length > 0) return onChainPositions
    return fallbackPositions
  }, [showDemoToggle, onChainPositions])

  const isShowingSampleData = onChainPositions.length === 0 || showDemoToggle

  const filtered = useMemo(() => {
    if (tab === 'all') return effectivePositions
    if (tab === 'open') return effectivePositions.filter((p) => p.status === 'open')
    return effectivePositions.filter((p) => p.status !== 'open')
  }, [tab, effectivePositions])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="section-head text-sm font-semibold uppercase tracking-[0.06em] text-text">
            ON-CHAIN_PORTFOLIO
          </h1>
          <p className="mt-1 text-xs text-textDim">
            Real-time positions &amp; claimable payouts on Solana Devnet
          </p>
        </div>

        {/* Source indicator / Refresh */}
        <div className="flex items-center gap-3">
          {onChainPositions.length > 0 && (
            <button
              onClick={() => setShowDemoToggle(!showDemoToggle)}
              className="rounded border border-border px-3 py-1.5 text-[11px] uppercase tracking-wider text-textDim hover:border-borderStrong hover:text-text transition"
            >
              {showDemoToggle ? 'VIEW ON-CHAIN' : 'VIEW SAMPLE DATA'}
            </button>
          )}

          {publicKey && (
            <button
              onClick={fetchOnChainPositions}
              className="rounded border border-cyan/40 bg-cyan/10 px-3 py-1.5 text-[11px] uppercase tracking-wider text-cyan hover:bg-cyan/20 transition"
            >
              REFRESH
            </button>
          )}
        </div>
      </div>

      {/* Notice badge if showing sample demo data */}
      {isShowingSampleData && (
        <div className="mt-4 flex items-center justify-between rounded border border-purple/30 bg-purple/10 px-4 py-2.5 text-xs text-purple">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-purple animate-pulse-dot" />
            <span>
              {publicKey
                ? 'No active token holdings found for this wallet. Showing sample prediction positions below.'
                : 'Connect your wallet to scan your live on-chain token holdings. Showing sample data below.'}
            </span>
          </div>
          <Link href="/" className="font-semibold text-cyan hover:underline">
            Trade Markets →
          </Link>
        </div>
      )}

      {/* Summary stats strip */}
      <div className="mt-6">
        <PortfolioSummary positions={effectivePositions} />
      </div>

      <div className="mt-8">
        <PositionsTabs active={tab} onChange={setTab} />
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded border border-border bg-bg2 py-16 text-center">
            <span className="h-2 w-2 rounded-full bg-cyan animate-pulse-dot" />
            <p className="text-xs uppercase tracking-wider text-textDim animate-pulse">
              Scanning Solana Devnet for your token accounts...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded border border-border bg-bg2 py-16 text-center">
            <p className="text-sm text-textDim">&gt; NO_POSITIONS_IN_THIS_TAB</p>
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
