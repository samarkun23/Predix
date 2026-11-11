'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Connection } from '@solana/web3.js'
import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import rawIdl from '@/idl/prediction_market_onchain.json'
import Button from '@/components/ui/Button'

const SAFE_PROGRAM_ID = new PublicKey('j3bfzTbouGfN1dUAcD81BpuzRKXt1jjqxJ86rk4ZybA')

interface ResolveMarketPanelProps {
  market: any
  onResolved: () => void // callback to refresh parent
}

export default function ResolveMarketPanel({ market, onResolved }: ResolveMarketPanelProps) {
  const { publicKey, signTransaction, signAllTransactions } = useWallet()
  const [selectedOutcome, setSelectedOutcome] = useState<1 | 2 | 3 | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Determine which role this wallet has for the market
  const acc = market?.account || market
  const isOracle = publicKey && acc?.resolutionOracle
    ? publicKey.toBase58() === new PublicKey(acc.resolutionOracle).toBase58()
    : false
  const isAdmin = publicKey && acc?.admin
    ? publicKey.toBase58() === new PublicKey(acc.admin).toBase58()
    : false

  // Nothing to show for regular users when market not yet resolved
  if (!isOracle && !isAdmin) return null
  // Once resolved and not disputed, this panel is no longer needed
  if (acc?.isResolved && !acc?.isDisputed) return null

  const isDisputeResolution = acc?.isResolved && acc?.isDisputed && isAdmin

  const handleResolve = async () => {
    if (!selectedOutcome || !publicKey || !signTransaction || !signAllTransactions) return
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

      if (isDisputeResolution) {
        // Admin resolves a dispute
        await program.methods
          .resolveDispute(selectedOutcome)
          .accounts({ admin: publicKey, market: marketPubkey })
          .rpc()
      } else {
        // Oracle resolves the market for the first time
        await program.methods
          .resolveMarket(selectedOutcome)
          .accounts({ market: marketPubkey, oracle: publicKey })
          .rpc()
      }

      onResolved()
    } catch (err: any) {
      console.error('Resolve failed:', err)
      setError(err?.message || 'Transaction failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const OUTCOMES = [
    { value: 1 as const, label: 'YES', sublabel: 'YES outcome wins', color: 'border-green bg-green/10 text-green' },
    { value: 2 as const, label: 'NO', sublabel: 'NO outcome wins', color: 'border-pink bg-pink/10 text-pink' },
    { value: 3 as const, label: 'VOID', sublabel: 'Refund 0.50¢ per share', color: 'border-amber bg-amber/10 text-amber' },
  ]

  return (
    <div className="rounded border border-purple/40 bg-purple/5 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-purple animate-pulse-dot" />
        <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-purple">
          {isDisputeResolution ? 'DISPUTE_RESOLUTION · ADMIN' : 'ORACLE_PANEL · RESOLVE_MARKET'}
        </h2>
      </div>

      <p className="mt-3 text-[11px] text-textDim">
        {isDisputeResolution
          ? 'This market has been disputed. As admin, select the final correct outcome to unfreeze funds.'
          : 'You are the designated oracle. Select the outcome that reflects the real-world result.'}
      </p>

      {/* Outcome selector */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {OUTCOMES.map((o) => (
          <button
            key={o.value}
            onClick={() => setSelectedOutcome(o.value)}
            className={`rounded border p-2 text-center transition-all ${
              selectedOutcome === o.value
                ? o.color + ' shadow-sm'
                : 'border-border text-textDim hover:border-borderStrong'
            }`}
          >
            <span className="block text-sm font-bold tracking-wide">{o.label}</span>
            <span className="block text-[9px] mt-0.5 uppercase tracking-wider opacity-70">{o.sublabel}</span>
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-3 rounded border border-red/30 bg-red/10 px-3 py-2 text-[11px] text-red">
          ERROR · {error}
        </p>
      )}

      <Button
        className="mt-4 w-full"
        onClick={handleResolve}
        disabled={!selectedOutcome || isLoading}
        variant="primary"
      >
        {isLoading
          ? 'SUBMITTING...'
          : isDisputeResolution
          ? `RESOLVE_DISPUTE · ${selectedOutcome ? OUTCOMES.find(o => o.value === selectedOutcome)?.label : '—'}`
          : `RESOLVE_MARKET · ${selectedOutcome ? OUTCOMES.find(o => o.value === selectedOutcome)?.label : 'SELECT OUTCOME'}`}
      </Button>
    </div>
  )
}
