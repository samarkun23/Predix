'use client'

import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Connection } from '@solana/web3.js'
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import rawIdl from '@/idl/prediction_market_onchain.json'
import Button from '@/components/ui/Button'
import { closeUserPosition } from '@/lib/portfolioStorage'

const SAFE_PROGRAM_ID = new PublicKey('j3bfzTbouGfN1dUAcD81BpuzRKXt1jjqxJ86rk4ZybA')

interface RedeemPanelProps {
  market: any
  onRedeemed: () => void // callback to refresh
}

export default function RedeemPanel({ market, onRedeemed }: RedeemPanelProps) {
  const { publicKey, signTransaction, signAllTransactions } = useWallet()
  const [winningBalance, setWinningBalance] = useState<number | null>(null)
  const [isFetchingBalance, setIsFetchingBalance] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txSig, setTxSig] = useState<string | null>(null)
  const [isWindowOpen, setIsWindowOpen] = useState(true)

  const acc = market?.account || market

  // Only show this panel when market is resolved, not disputed, and window has passed
  useEffect(() => {
    if (!acc?.isResolved || acc?.isDisputed) return

    const deadline = acc?.disputeDeadline?.toNumber?.() ?? 0
    const nowSec = Math.floor(Date.now() / 1000)
    setIsWindowOpen(nowSec < deadline)

    // Re-check every second until window closes
    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000)
      const windowOpen = now < deadline
      setIsWindowOpen(windowOpen)
      if (!windowOpen) clearInterval(timer)
    }, 1000)
    return () => clearInterval(timer)
  }, [acc])

  // Fetch the user's winning token balance
  useEffect(() => {
    if (!publicKey || !acc?.isResolved || acc?.isDisputed || isWindowOpen) return

    const fetchBalance = async () => {
      setIsFetchingBalance(true)
      try {
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
        const outcome = acc.winningOutcome

        // For outcome 3 (VOID), user can hold either YES or NO — check both
        let totalBalance = 0

        if (outcome === 1 || outcome === 3) {
          const yesMint = new PublicKey(acc.outcomeYesMint)
          const yesAta = getAssociatedTokenAddressSync(yesMint, publicKey)
          const info = await connection.getAccountInfo(yesAta)
          if (info) {
            const bal = await connection.getTokenAccountBalance(yesAta)
            totalBalance += Number(bal.value.amount)
          }
        }

        if (outcome === 2 || outcome === 3) {
          const noMint = new PublicKey(acc.outcomeNoMint)
          const noAta = getAssociatedTokenAddressSync(noMint, publicKey)
          const info = await connection.getAccountInfo(noAta)
          if (info) {
            const bal = await connection.getTokenAccountBalance(noAta)
            totalBalance += Number(bal.value.amount)
          }
        }

        setWinningBalance(totalBalance / 1_000_000)
      } catch (err) {
        console.error('Failed to fetch winning balance:', err)
        setWinningBalance(0)
      } finally {
        setIsFetchingBalance(false)
      }
    }

    fetchBalance()
  }, [publicKey, acc, isWindowOpen])

  // Don't show until market is fully resolved + not disputed
  if (!acc?.isResolved || acc?.isDisputed) return null

  // Show a waiting state if dispute window still open
  if (isWindowOpen) {
    return (
      <div className="rounded border border-border bg-bg2 p-4 sm:p-5">
        <h2 className="section-head text-xs font-semibold uppercase tracking-[0.06em] text-text">
          CLAIM_WINNINGS
        </h2>
        <p className="mt-3 text-[11px] text-textDim">
          Redemption will be available once the 48-hour dispute window closes.
        </p>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-amber">
          <span className="h-1.5 w-1.5 rounded-full bg-amber animate-pulse-dot" />
          DISPUTE WINDOW STILL OPEN — PLEASE WAIT
        </div>
      </div>
    )
  }

  // Don't show if no wallet connected
  if (!publicKey) {
    return (
      <div className="rounded border border-border bg-bg2 p-4 sm:p5">
        <h2 className="section-head text-xs font-semibold uppercase tracking-[0.06em] text-text">
          CLAIM_WINNINGS
        </h2>
        <p className="mt-3 text-[11px] text-textDim">Connect your wallet to claim winnings.</p>
      </div>
    )
  }

  const outcomeLabel =
    acc.winningOutcome === 1 ? 'YES' : acc.winningOutcome === 2 ? 'NO' : 'VOID'
  const outcomeColor =
    acc.winningOutcome === 1 ? 'text-green' : acc.winningOutcome === 2 ? 'text-pink' : 'text-amber'

  // Payout calculation: 1:1 for YES/NO, 0.5:1 for VOID
  const payoutAmount = winningBalance !== null
    ? acc.winningOutcome === 3
      ? winningBalance / 2
      : winningBalance
    : null

  const handleRedeem = async () => {
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

      const usdcMint = new PublicKey(acc.usdcMint)
      const vaultAuthority = PublicKey.findProgramAddressSync(
        [Buffer.from('vault'), marketPubkey.toBuffer()],
        SAFE_PROGRAM_ID
      )[0]

      // Determine the winning mint to use
      let winningMintPubkey: PublicKey
      if (acc.winningOutcome === 1) {
        winningMintPubkey = new PublicKey(acc.outcomeYesMint)
      } else if (acc.winningOutcome === 2) {
        winningMintPubkey = new PublicKey(acc.outcomeNoMint)
      } else {
        // VOID — redeem whichever token the user holds
        const yesMint = new PublicKey(acc.outcomeYesMint)
        const yesAta = getAssociatedTokenAddressSync(yesMint, publicKey)
        const info = await connection.getAccountInfo(yesAta)
        winningMintPubkey = info ? yesMint : new PublicKey(acc.outcomeNoMint)
      }

      const userWinningAta = getAssociatedTokenAddressSync(winningMintPubkey, publicKey)
      const userUsdcAta = getAssociatedTokenAddressSync(usdcMint, publicKey)
      const vaultUsdcAta = getAssociatedTokenAddressSync(usdcMint, vaultAuthority, true)

      const tx = await program.methods
        .redeem()
        .accounts({
          user: publicKey,
          market: marketPubkey,
          userWinningAta,
          winningMint: winningMintPubkey,
          userUsdcAta,
          vaultUsdcAta,
          vaultAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc()

      setTxSig(tx)
      setWinningBalance(0)
      closeUserPosition(publicKey.toBase58(), `${market.id}`, 'resolved-won')
      onRedeemed()
    } catch (err: any) {
      console.error('Redeem failed:', err)
      setError(err?.message || 'Transaction failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded border border-green/30 bg-green/5 p-4 sm:p-5">
      <h2 className="section-head text-xs font-semibold uppercase tracking-[0.06em] text-green">
        CLAIM_WINNINGS
      </h2>

      {/* Outcome badge */}
      <div className="mt-3 flex items-center gap-2">
        <span className={`text-xs font-bold uppercase tracking-wide ${outcomeColor}`}>
          FINAL OUTCOME:
        </span>
        <span
          className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase ${
            acc.winningOutcome === 1
              ? 'bg-green/15 text-green'
              : acc.winningOutcome === 2
              ? 'bg-pink/15 text-pink'
              : 'bg-amber/15 text-amber'
          }`}
        >
          {outcomeLabel}
        </span>
      </div>

      {/* Balance summary */}
      <div className="mt-4 rounded border border-border bg-bg p-3 space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-textDim uppercase tracking-[0.06em]">
            Your {acc.winningOutcome === 3 ? 'Shares' : outcomeLabel + ' Tokens'}
          </span>
          <span className="font-bold text-text">
            {isFetchingBalance ? '…' : winningBalance !== null ? winningBalance.toFixed(2) : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-textDim uppercase tracking-[0.06em]">
            USDC Payout {acc.winningOutcome === 3 ? '(0.50¢ per share)' : '(1:1)'}
          </span>
          <span className={`font-bold ${outcomeColor}`}>
            {isFetchingBalance ? '…' : payoutAmount !== null ? `${payoutAmount.toFixed(2)} USDC` : '—'}
          </span>
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded border border-red/30 bg-red/10 px-3 py-2 text-[11px] text-red">
          ERROR · {error}
        </p>
      )}

      {txSig && (
        <p className="mt-3 rounded border border-green/30 bg-green/10 px-3 py-2 text-[11px] text-green">
          ✓ CLAIMED · tx: {txSig.slice(0, 8)}...{txSig.slice(-8)}
        </p>
      )}

      <Button
        variant={acc.winningOutcome === 2 ? 'no' : 'yes'}
        className="mt-4 w-full"
        onClick={handleRedeem}
        disabled={
          isLoading ||
          isFetchingBalance ||
          winningBalance === null ||
          winningBalance <= 0 ||
          !!txSig
        }
      >
        {isLoading
          ? 'CLAIMING...'
          : txSig
          ? 'CLAIMED ✓'
          : winningBalance !== null && winningBalance <= 0
          ? 'NO WINNING TOKENS'
          : `CLAIM · ${payoutAmount?.toFixed(2) ?? '—'} USDC`}
      </Button>

      {winningBalance !== null && winningBalance <= 0 && !txSig && (
        <p className="mt-2 text-center text-[10px] text-textFaint">
          Your wallet holds no {outcomeLabel} tokens for this market.
        </p>
      )}
    </div>
  )
}
