'use client'

import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Connection } from '@solana/web3.js'
import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import rawIdl from '@/idl/prediction_market_onchain.json'
import Button from '@/components/ui/Button'

const SAFE_PROGRAM_ID = new PublicKey('j3bfzTbouGfN1dUAcD81BpuzRKXt1jjqxJ86rk4ZybA')

interface DisputeBannerProps {
  market: any
  onDisputed: () => void // callback to refresh parent
}

function formatCountdown(secondsLeft: number): string {
  if (secondsLeft <= 0) return '00:00:00'
  const h = Math.floor(secondsLeft / 3600)
  const m = Math.floor((secondsLeft % 3600) / 60)
  const s = secondsLeft % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function DisputeBanner({ market, onDisputed }: DisputeBannerProps) {
  const { publicKey, signTransaction, signAllTransactions } = useWallet()
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const acc = market?.account || market

  // Compute remaining seconds in the dispute window
  useEffect(() => {
    if (!acc?.isResolved || acc?.isDisputed) return

    const deadline = acc?.disputeDeadline?.toNumber?.() ?? 0
    const update = () => {
      const diff = deadline - Math.floor(Date.now() / 1000)
      setSecondsLeft(Math.max(0, diff))
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [acc])

  // Only show if market is resolved but not yet disputed and window is open
  if (!acc?.isResolved || acc?.isDisputed) return null
  if (secondsLeft <= 0) return null

  const handleDispute = async () => {
    if (!publicKey || !signTransaction || !signAllTransactions) return
    setIsLoading(true)
    setError(null)
    try {
      const connection = new Connection('https://api.devnet.solana.com', 'processed')
      const provider = new anchor.AnchorProvider(
        connection,
        { publicKey, signTransaction, signAllTransactions } as any,
        { commitment: 'processed' }
      )
      const program = new Program(rawIdl as any, provider as any) as any
      const marketPubkey = new PublicKey(market.id)

      await program.methods
        .disputeMarket()
        .accounts({ disputer: publicKey, market: marketPubkey })
        .rpc()

      onDisputed()
    } catch (err: any) {
      console.error('Dispute failed:', err)
      setError(err?.message || 'Transaction failed.')
    } finally {
      setIsLoading(false)
      setShowConfirm(false)
    }
  }

  // Display the winning outcome string
  const outcomeLabel =
    acc?.winningOutcome === 1 ? 'YES' : acc?.winningOutcome === 2 ? 'NO' : 'VOID'

  return (
    <div className="rounded border border-amber/40 bg-amber/5 p-4 sm:p-5">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-amber animate-pulse-dot" />
          <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-amber">
            DISPUTE_WINDOW · OPEN
          </h2>
        </div>
        <span className="font-mono text-lg font-bold text-amber tabular-nums">
          {formatCountdown(secondsLeft)}
        </span>
      </div>

      <p className="mt-2 text-[11px] text-textDim">
        This market was resolved as{' '}
        <span className="font-semibold text-text">{outcomeLabel}</span>. If you believe this is
        incorrect, you can dispute it before the window closes. A market admin will make the final
        determination.
      </p>

      {error && (
        <p className="mt-3 rounded border border-red/30 bg-red/10 px-3 py-2 text-[11px] text-red">
          ERROR · {error}
        </p>
      )}

      {!showConfirm ? (
        <Button
          variant="ghost"
          className="mt-3 w-full border-amber/40 text-amber hover:border-amber hover:text-amber"
          onClick={() => setShowConfirm(true)}
          disabled={!publicKey}
        >
          {publicKey ? 'DISPUTE_OUTCOME' : 'CONNECT WALLET TO DISPUTE'}
        </Button>
      ) : (
        <div className="mt-3 rounded border border-amber/30 bg-amber/5 p-3">
          <p className="text-[11px] text-amber">
            ⚠ Are you sure? This will freeze the market until the admin resolves the dispute.
          </p>
          <div className="mt-2 flex gap-2">
            <Button
              variant="ghost"
              className="flex-1 border-border text-textDim"
              onClick={() => setShowConfirm(false)}
              disabled={isLoading}
            >
              CANCEL
            </Button>
            <Button
              className="flex-1 border-amber/40 bg-amber/10 text-amber hover:bg-amber/20"
              onClick={handleDispute}
              disabled={isLoading}
            >
              {isLoading ? 'SUBMITTING...' : 'CONFIRM_DISPUTE'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
