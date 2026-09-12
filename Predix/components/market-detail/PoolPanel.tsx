"use client"
import type { PoolState } from '@/lib/types'
import Button from '@/components/ui/Button'
import { Connection, PublicKey } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { useEffect, useState } from 'react'
import * as anchor from "@coral-xyz/anchor";
import rawIdl from "@/idl/prediction_market_onchain.json"
import { Program } from "@coral-xyz/anchor"
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token'

interface PoolPanelProps {
  pool: PoolState,
  market: any
}

// Static, illustrative price-impact curve (not derived from live depth) —
// just meant to communicate "impact grows with trade size" visually.
const CURVE_POINTS = [0, 2, 5, 9, 15, 23, 33, 45, 58, 72, 85, 96]
const SAFE_PROGRAM_ID = new PublicKey("j3bfzTbouGfN1dUAcD81BpuzRKXt1jjqxJ86rk4ZybA");

export default function PoolPanel({ pool, market }: PoolPanelProps) {
  const {publicKey, signTransaction, signAllTransactions} = useWallet();
  const [amount, setAmount] = useState('5');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // real state
  const [yesReserve, setYesReserve] = useState(0)
  const [noReserve, setNoReserve] = useState(0)
  const [isLoadingReserves, setIsLoadingReserves] = useState(true)

  
  useEffect(() => {
    const fetchReserves = async () => {
      if (!market) return
      
      try {
        const connection = new Connection("https://api.devnet.solana.com", "confirmed")
        const acc = market.account || market
        
        const yesMint = acc.outcomeYesMint || acc.outcome_yes_mint
        const noMint = acc.outcomeNoMint || acc.outcome_no_mint
        const marketId = market.id || market.publicKey?.toString()
        
        if (!yesMint || !noMint || !marketId) {
          console.warn("Missing market data for reserves")
          return
        }
        
        const marketPubkey = new PublicKey(marketId)
        const vaultAuthority = PublicKey.findProgramAddressSync(
          [Buffer.from('vault'), marketPubkey.toBuffer()],
          SAFE_PROGRAM_ID
        )[0]
        
        const vaultYesAta = getAssociatedTokenAddressSync(new PublicKey(yesMint), vaultAuthority, true)
        const vaultNoAta = getAssociatedTokenAddressSync(new PublicKey(noMint), vaultAuthority, true)
        
        const yesBalance = await connection.getTokenAccountBalance(vaultYesAta)
        const noBalance = await connection.getTokenAccountBalance(vaultNoAta)
        
        const yesAmt = Number(yesBalance.value.amount) / 1_000_000
        const noAmt = Number(noBalance.value.amount) / 1_000_000
        
        setYesReserve(yesAmt)
        setNoReserve(noAmt)
        setIsLoadingReserves(false)
        
        console.log("✅ Pool Reserves:", { yes: yesAmt, no: noAmt })
      } catch (err) {
        console.error("Failed to fetch reserves:", err)
        setIsLoadingReserves(false)
      }
    }
    
    fetchReserves()
    // Refresh every 10 seconds
    const interval = setInterval(fetchReserves, 10000)
    return () => clearInterval(interval)
  }, [market])
  

  const total = yesReserve + noReserve;
  const yesPct = total > 0 ? (yesReserve / total) * 100 : 50
  const yesPrice = yesPct / 100

  const curveW = 240
  const curveH = 60
  const maxCurve = Math.max(...CURVE_POINTS)
  const curvePath = CURVE_POINTS.map((v, i) => {
    const x = (i / (CURVE_POINTS.length - 1)) * curveW
    const y = curveH - (v / maxCurve) * curveH
    return `${x},${y}`
  }).join(' ')
  
  const handleAddLiquidity = async () => {
    if(!publicKey || !signTransaction || !signAllTransactions || !market){
      alert("Pz connect your wallet")
      return;
    }

    const amountNum = parseFloat(amount)
    if(!amount || amountNum <= 0){
      alert("Pz enter a vaild amount")
      return
    }

    setIsLoading(true)
    try {
      const acc = market.account || market;
      const yesMint = acc.outcomeYesMint || acc.outcome_yes_mint; 
      const noMint = acc.outcomeNoMint || acc.outcome_no_mint;
      const marketId = market.id || market.publicKey?.toString();
      if(!yesMint || !noMint || !marketId){
        alert("Market data incomplete!")
        return
      }
      
      const connection = new Connection("https://api.devnet.solana.com", "processed");
      const wallet = {
        publicKey,
        signTransaction,
        signAllTransactions
      } as any;
      const provider = new anchor.AnchorProvider(connection, wallet, {
        commitment: "processed"
      });
      //TODO: check this
      const program = new Program(rawIdl as any, provider as any) as any;

      const amountLamports = new anchor.BN(amountNum * 1_000_000);
      const marketPubkey = new PublicKey(marketId);

      const vaultAuthority = PublicKey.findProgramAddressSync(
        [Buffer.from('vault'), marketPubkey.toBuffer()],
        SAFE_PROGRAM_ID
      )[0]

      const userYesAta = getAssociatedTokenAddressSync(new PublicKey(yesMint), publicKey)
      const userNoAta = getAssociatedTokenAddressSync(new PublicKey(noMint), publicKey)
      const vaultYesAta = getAssociatedTokenAddressSync(new PublicKey(yesMint), vaultAuthority, true)
      const vaultNoAta = getAssociatedTokenAddressSync(new PublicKey(noMint), vaultAuthority, true)

      const tx = await program.methods
        .addLiquidity(amountLamports)
        .accounts({
          lpProvider: publicKey,
          market: marketPubkey,
          yesMint: new PublicKey(yesMint),
          noMint: new PublicKey(noMint),
          lpYesAta: userYesAta,
          lpNoAta: userNoAta,
          vaultYesAta,
          vaultNoAta,
          vaultAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc()

      alert('Liquidity added successfully!')
      setShowAddForm(false)
      setAmount('5')
      window.location.reload()

    } catch (error: any) {
      console.error('Add liquidity failed:', error)
      alert(`Failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded border border-border bg-bg2 p-4 sm:p-5">
      <h2 className="section-head text-xs font-semibold uppercase tracking-[0.06em] text-text">
        LIQUIDITY_POOL
      </h2>

      <p className="mt-3 text-3xl font-bold text-green" style={{ textShadow: '0 0 14px currentColor' }}>
        {isLoadingReserves ? "...": yesPrice.toFixed(2)}
      </p>
      <p className="mt-1 text-[11px] text-textFaint">
        Price derived from pool reserves — no order book, no matching engine
      </p>

      <div className="mt-4 flex h-2 overflow-hidden rounded-full border border-border">
        <div className="bg-green" style={{ width: `${yesPct}%` }} />
        <div className="bg-pink" style={{ width: `${100 - yesPct}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px]">
        <span className="text-green">
          YES_RESERVE · ${isLoadingReserves ? '...' : (yesReserve / 1000).toFixed(1)}K ({yesPct.toFixed(0)}%)
        </span>
        <span className="text-pink">
          NO_RESERVE · ${isLoadingReserves ? '...' : (noReserve / 1000).toFixed(1)}K ({(100 - yesPct).toFixed(0)}%)
        </span>
      </div>

      <div className="mt-4 space-y-2 border-t border-border pt-4 text-xs text-textDim">
        <div className="flex justify-between">
          <span>POOL_TVL</span>
          <span className="text-text">${isLoadingReserves ? '...' :  total.toLocaleString() }</span>
        </div>
        <div className="flex justify-between">
          <span>SWAP_FEE</span>
          <span className="text-text">{(pool?.feeBps ? pool.feeBps / 100 : 0.3).toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span>LP_PROVIDERS</span>
          <span className="text-text">{pool?.lpProviders || 1} wallets</span>
        </div>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <h3 className="text-[11px] uppercase tracking-[0.06em] text-textDim">
          // PRICE_IMPACT_CURVE
        </h3>
        <svg viewBox={`0 0 ${curveW} ${curveH}`} className="mt-2 h-14 w-full" preserveAspectRatio="none">
          <polyline
            points={curvePath}
            fill="none"
            stroke="#2DF4E6"
            strokeWidth={2}
            style={{ filter: 'drop-shadow(0 0 4px rgba(45,244,230,0.6))' }}
          />
        </svg>
      </div>

      {/* ADD / REMOVE LIQUIDITY ACTIONS */}
      <div className="mt-4 border-t border-border pt-4 space-y-2">
        {!showAddForm ? (
          <Button
            variant="secondary"
            className="w-full border-purple text-purple hover:bg-purple/10"
            onClick={() => setShowAddForm(true)}
          >
            ADD_LIQUIDITY
          </Button>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] uppercase tracking-[0.06em] text-textDim">Amount (YES + NO pairs)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-cyan"
                placeholder="5"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                className="w-full border-purple text-purple hover:bg-purple/10"
                onClick={handleAddLiquidity}
                disabled={isLoading}
              >
                {isLoading ? 'ADDING...' : 'CONFIRM'}
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setShowAddForm(false)
                  setAmount('5')
                }}
                disabled={isLoading}
              >
                CANCEL
              </Button>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          className="w-full opacity-50 cursor-not-allowed"
          disabled
        >
          REMOVE_LIQUIDITY (Coming Soon)
        </Button>
      </div>
    </div> 
  )
}
