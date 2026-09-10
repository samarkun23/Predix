'use client'

import { useEffect, useMemo, useState } from 'react'
import type { PoolState } from '@/lib/types'
import * as anchor from '@coral-xyz/anchor'
import Button from '@/components/ui/Button'
import { quoteSwap } from '@/lib/amm'
import { useWallet } from '@solana/wallet-adapter-react'
import { amountToUiAmount, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { getProgram } from '@/lib/anchor'

interface SwapPanelProps {
  market: any;
  pool: PoolState
}

export default function SwapPanel({ market, pool }: SwapPanelProps) {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();

  const [side, setSide] = useState<'yes' | 'no'>('yes')
  const [amount, setAmount] = useState('100.00')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false);

  // mods 
  const [mode, setMode] = useState<'MINT' | 'ADD_LIQIDITY' | 'SWAP'>('MINT');
  const [userYesBalance , setUserYesBalance] = useState(0);
  const [userNoBalance , setUserNoBalance] = useState(0);

  useEffect(() => {
    const checkBalance = async () => {
      if (!publicKey || !market) return

      try {
        const connection = new anchor.web3.Connection(
          "https://api.devnet.solana.com", "confirmed");
        const yesAta = getAssociatedTokenAddressSync(new PublicKey(market.account.yesMint), publicKey);
        const noAta = getAssociatedTokenAddressSync(new PublicKey(market.account.noMint), publicKey);

        // TODO: fix this type issue 
        //@ts-ignore
        const yesInfo = new connection.getAccountInfo(yesAta);
        //@ts-ignore
        const noInfo = new connection.getAccountInfo(noAta);

        const yesBal = yesInfo ? Number((await connection.getTokenAccountBalance(yesAta)).value.amount) / 1_000_000 : 0;
        const noBal = yesInfo ? Number((await connection.getTokenAccountBalance(noAta)).value.amount) / 1_000_000 : 0;

        setUserYesBalance(yesBal);
        setUserNoBalance(noBal);

        // determine mode based on balances and pool state 
        const poolHasLiqidity = pool && (pool.yesReserve > 1 || pool.noReserve > 1);

        if(!poolHasLiqidity && yesBal > 0 && noBal > 0){
          setMode('ADD_LIQIDITY');
        }else if(poolHasLiqidity){
          setMode('SWAP');
        }else {
          setMode('MINT')
        }

      } catch (error) {
        
      }
    }
    checkBalance()
  },[publicKey, market,pool])

  const amountUsdc = parseFloat(amount) || 0
  const quote = useMemo(() => quoteSwap(pool, side, amountUsdc), [pool, side, amountUsdc])

  const handleAction = async () => {
    if(!publicKey || !signTransaction || !signAllTransactions || !market){
      alert('Pz connect your wallet')
    }
    if (!amount || amountUsdc <= 0) return

    setIsLoading(true)
    try {
      const program = getProgram(publicKey!, signTransaction!, signAllTransactions! );  
      const amountLamports = new anchor.BN(amountUsdc * 1_000_000);

      const vaultAuthority = PublicKey.findProgramAddressSync(
        [Buffer.from('vault'), market.publicKey.toBuffer()],
        program.programId
      )[0]

      if(mode === 'MINT'){
        const userUsdcAta = getAssociatedTokenAddressSync(new PublicKey(market.account.usdcMint), publicKey!);
        const userYesAta = getAssociatedTokenAddressSync(new PublicKey(market.account.outcomeYesMint), publicKey!);
        const userNoAta = getAssociatedTokenAddressSync(new PublicKey(market.account.outcomeNoMint), publicKey!);
        const vaultUsdcAta = getAssociatedTokenAddressSync(new PublicKey(market.account.usdcMint), vaultAuthority, true);

        await program.methods
          .mintShares(amountLamports)
          .accounts({
            user: publicKey!, market: new PublicKey(market.id),
            usdcMint: new PublicKey(market.account.usdcMint),
            yesMint: new PublicKey(market.account.outcomeYesMint),
            noMint: new PublicKey(market.account.outcomeNoMint),
            userUsdcAta, userYesAta, userNoAta,
            vaultAuthority,
            vaultUsdcAta,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId
          }).rpc()
      }else if(mode === 'ADD_LIQIDITY'){
        
      }
    } catch (error) {
      
    }
  }

  return (
    <div className="safe-bottom sticky bottom-0 z-30 rounded border border-border bg-bg2/95 p-4 backdrop-blur-sm sm:p-5 lg:sticky lg:top-20 lg:bottom-auto lg:bg-bg2 lg:backdrop-blur-none">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setSide('yes')}
          className={`min-h-[44px] rounded border text-xs font-semibold uppercase tracking-[0.06em] transition-colors ${
            side === 'yes' ? 'border-green bg-green/10 text-green shadow-glow-green' : 'border-border text-textDim'
          }`}
        >
          BUY_YES
        </button>
        <button
          onClick={() => setSide('no')}
          className={`min-h-[44px] rounded border text-xs font-semibold uppercase tracking-[0.06em] transition-colors ${
            side === 'no' ? 'border-pink bg-pink/10 text-pink shadow-glow-pink' : 'border-border text-textDim'
          }`}
        >
          BUY_NO
        </button>
      </div>

      <label className="mt-4 block text-[11px] uppercase tracking-[0.06em] text-textDim">
        AMOUNT (USDC)
      </label>
      <input
        type="number"
        min="0"
        step="1"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="mt-1.5 min-h-[44px] w-full rounded border border-border bg-bg px-3 text-sm text-text outline-none focus:border-cyan"
      />

      <button
        onClick={() => setDetailsOpen((v) => !v)}
        className="mt-3 flex w-full items-center justify-between text-[11px] uppercase tracking-[0.06em] text-textDim lg:hidden"
      >
        DETAILS
        <span>{detailsOpen ? '−' : '+'}</span>
      </button>

      <div className={`${detailsOpen ? 'block' : 'hidden'} lg:block`}>
        <div className="mt-3 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-textDim">AVG_EXEC_PRICE</span>
            <span className="text-text">{quote.avgExecPrice.toFixed(3)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-textDim">SHARES_OUT</span>
            <span className="text-text">
              {quote.sharesOut.toFixed(2)} {side.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-textDim">PRICE_IMPACT</span>
            <span className={Math.abs(quote.priceImpactPct) > 1 ? 'text-amber' : 'text-textDim'}>
              {quote.priceImpactPct.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-textDim">MIN_RECEIVED (0.5% SLIPPAGE)</span>
            <span className="text-text">
              {quote.minReceived.toFixed(2)} {side.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <Button
        variant={side}
        className="mt-4 w-full"
        onClick={() => {
          // TODO: wire up @solana/wallet-adapter swap instruction
        }}
      >
        SWAP · BUY_{side.toUpperCase()}
      </Button>
    </div>
  )
}
