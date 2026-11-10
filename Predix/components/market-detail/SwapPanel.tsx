'use client'

import { useMemo, useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Connection, Transaction } from '@solana/web3.js'
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'
import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import rawIdl from '@/idl/prediction_market_onchain.json'
import type { PoolState } from '@/lib/types'
import Button from '@/components/ui/Button'
import { quoteSwap } from '@/lib/amm'
import { saveUserPosition, closeUserPosition } from '@/lib/portfolioStorage'

const SAFE_PROGRAM_ID = new PublicKey('j3bfzTbouGfN1dUAcD81BpuzRKXt1jjqxJ86rk4ZybA')

interface SwapPanelProps {
  market: any
  pool: PoolState
}

type PanelMode = 'buy' | 'swap' | 'merge'

export default function SwapPanel({ market, pool }: SwapPanelProps) {
  const { publicKey, signTransaction, signAllTransactions } = useWallet()

  const [mode, setMode] = useState<PanelMode>('buy')
  const [side, setSide] = useState<'yes' | 'no'>('yes')
  const [amount, setAmount] = useState('5')
  const [isLoading, setIsLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Balances
  const [userUsdcBalance, setUserUsdcBalance] = useState(0)
  const [userYesBalance, setUserYesBalance] = useState(0)
  const [userNoBalance, setUserNoBalance] = useState(0)

  // Fetch balances
  const checkBalances = async () => {
    if (!publicKey || !market) return

    try {
      const acc = market.account || market
      const yesMintRaw = acc.outcomeYesMint || acc.outcome_yes_mint
      const noMintRaw = acc.outcomeNoMint || acc.outcome_no_mint
      const usdcMintRaw = acc.usdcMint || acc.usdc_mint

      if (!yesMintRaw || !noMintRaw) return

      const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
      const yesMint = new PublicKey(yesMintRaw.toString())
      const noMint = new PublicKey(noMintRaw.toString())
      const usdcMint = usdcMintRaw
        ? new PublicKey(usdcMintRaw.toString())
        : new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')

      const yesAta = getAssociatedTokenAddressSync(yesMint, publicKey)
      const noAta = getAssociatedTokenAddressSync(noMint, publicKey)
      const usdcAta = getAssociatedTokenAddressSync(usdcMint, publicKey)

      // YES balance
      try {
        const bal = await connection.getTokenAccountBalance(yesAta)
        setUserYesBalance(Number(bal.value.amount) / 1_000_000)
      } catch {
        setUserYesBalance(0)
      }

      // NO balance
      try {
        const bal = await connection.getTokenAccountBalance(noAta)
        setUserNoBalance(Number(bal.value.amount) / 1_000_000)
      } catch {
        setUserNoBalance(0)
      }

      // USDC balance
      try {
        const bal = await connection.getTokenAccountBalance(usdcAta)
        setUserUsdcBalance(Number(bal.value.amount) / 1_000_000)
      } catch {
        setUserUsdcBalance(0)
      }
    } catch (err) {
      console.error('Error checking balances:', err)
    }
  }

  useEffect(() => {
    checkBalances()
    const interval = setInterval(checkBalances, 8000)
    return () => clearInterval(interval)
  }, [publicKey, market])

  const amountNum = parseFloat(amount) || 0
  const quote = useMemo(() => quoteSwap(pool, side, amountNum), [pool, side, amountNum])

  const getKeys = () => {
    if (!market) return { usdcMint: '', yesMint: '', noMint: '', marketId: '' }
    const acc = market.account || market
    return {
      usdcMint: acc.usdcMint?.toString() || acc.usdc_mint?.toString() || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
      yesMint: acc.outcomeYesMint?.toString() || acc.outcome_yes_mint?.toString() || '',
      noMint: acc.outcomeNoMint?.toString() || acc.outcome_no_mint?.toString() || '',
      marketId: market.id?.toString() || market.publicKey?.toString() || '',
    }
  }

  // 1-Click Buy with USDC (bundles mint_shares + swap into 1 single transaction!)
  const handleBuyWithUsdc = async () => {
    const { usdcMint, yesMint, noMint, marketId } = getKeys()
    if (!usdcMint || !yesMint || !noMint || !marketId || !publicKey) return

    if (amountNum <= 0) {
      setErrorMsg('Please enter a valid USDC amount.')
      return
    }

    setIsLoading(true)
    setErrorMsg(null)
    setStatusMsg(`Executing 1-Click Buy: Minting & Swapping to ${side.toUpperCase()}...`)

    try {
      const connection = new Connection('https://api.devnet.solana.com', 'processed')
      const provider = new anchor.AnchorProvider(
        connection,
        { publicKey, signTransaction, signAllTransactions } as any,
        { commitment: 'processed' }
      )
      const program = new Program(rawIdl as any, provider as any) as any

      const amountLamports = new anchor.BN(Math.floor(amountNum * 1_000_000))
      const marketPubkey = new PublicKey(marketId)
      const usdcPubkey = new PublicKey(usdcMint)
      const yesPubkey = new PublicKey(yesMint)
      const noPubkey = new PublicKey(noMint)

      const vaultAuthority = PublicKey.findProgramAddressSync(
        [Buffer.from('vault'), marketPubkey.toBuffer()],
        SAFE_PROGRAM_ID
      )[0]

      const userUsdcAta = getAssociatedTokenAddressSync(usdcPubkey, publicKey)
      const userYesAta = getAssociatedTokenAddressSync(yesPubkey, publicKey)
      const userNoAta = getAssociatedTokenAddressSync(noPubkey, publicKey)
      const vaultUsdcAta = getAssociatedTokenAddressSync(usdcPubkey, vaultAuthority, true)
      const vaultYesAta = getAssociatedTokenAddressSync(yesPubkey, vaultAuthority, true)
      const vaultNoAta = getAssociatedTokenAddressSync(noPubkey, vaultAuthority, true)

      // Step 1 Instruction: Mint shares with USDC (gives amount YES + amount NO)
      const mintIx = await program.methods
        .mintShares(amountLamports)
        .accounts({
          user: publicKey,
          market: marketPubkey,
          usdcMint: usdcPubkey,
          yesMint: yesPubkey,
          noMint: noPubkey,
          userUsdcAta,
          userYesAta,
          userNoAta,
          vaultAuthority,
          vaultUsdcAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .instruction()

      // Step 2 Instruction: Swap the unwanted outcome shares to the desired outcome!
      // If user wants YES: swap the minted NO shares for YES!
      // If user wants NO: swap the minted YES shares for NO!
      const sourceAta = side === 'yes' ? userNoAta : userYesAta
      const destAta = side === 'yes' ? userYesAta : userNoAta
      const vaultSourceAta = side === 'yes' ? vaultNoAta : vaultYesAta
      const vaultDestAta = side === 'yes' ? vaultYesAta : vaultNoAta

      const swapIx = await program.methods
        .swap(amountLamports)
        .accounts({
          user: publicKey,
          market: marketPubkey,
          outcomeYesMint: yesPubkey,
          outcomeNoMint: noPubkey,
          userSourceAta: sourceAta,
          userDestinationAta: destAta,
          vaultSourceAta: vaultSourceAta,
          vaultDestinationAta: vaultDestAta,
          vaultAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction()

      // Bundle both instructions in one transaction
      const tx = new Transaction().add(mintIx).add(swapIx)
      const txSig = await provider.sendAndConfirm(tx)

      console.log('✅ 1-Click Buy successful:', txSig)
      setStatusMsg(`Successfully purchased ${side.toUpperCase()} shares!`)

      const totalReserves = (pool?.yesReserve ?? 0) + (pool?.noReserve ?? 0)
      const yesSpotPrice = totalReserves > 0 ? ((pool.noReserve ?? 0) / totalReserves) * 100 : 50
      const activePrice = side === 'yes' ? yesSpotPrice : (100 - yesSpotPrice)

      // Record position in portfolio storage
      saveUserPosition(publicKey.toBase58(), {
        id: `${marketId}-${side}`,
        marketId,
        marketQuestion: market?.question || market?.account?.question || 'Prediction Market',
        side,
        entryPrice: activePrice,
        currentPrice: activePrice,
        sizeUsd: amountNum,
        shares: amountNum,
        status: 'open',
        txSig,
        timestamp: Date.now(),
      })

      await checkBalances()
      setTimeout(() => setStatusMsg(null), 4000)
    } catch (err: any) {
      console.error('1-Click Buy failed:', err)
      setErrorMsg(err?.message || 'Transaction failed.')
    } finally {
      setIsLoading(false)
    }
  }

  // Pure Swap (YES <-> NO)
  const handleSwapOnly = async () => {
    const { yesMint, noMint, marketId } = getKeys()
    if (!yesMint || !noMint || !marketId || !publicKey) return

    if (side === 'yes' && userNoBalance < amountNum) {
      setErrorMsg(`Insufficient NO balance (${userNoBalance.toFixed(2)}) to swap for YES.`)
      return
    }
    if (side === 'no' && userYesBalance < amountNum) {
      setErrorMsg(`Insufficient YES balance (${userYesBalance.toFixed(2)}) to swap for NO.`)
      return
    }

    setIsLoading(true)
    setErrorMsg(null)
    try {
      const connection = new Connection('https://api.devnet.solana.com', 'processed')
      const provider = new anchor.AnchorProvider(
        connection,
        { publicKey, signTransaction, signAllTransactions } as any,
        { commitment: 'processed' }
      )
      const program = new Program(rawIdl as any, provider as any) as any

      const swapAmount = new anchor.BN(Math.floor(amountNum * 1_000_000))
      const marketPubkey = new PublicKey(marketId)
      const vaultAuthority = PublicKey.findProgramAddressSync(
        [Buffer.from('vault'), marketPubkey.toBuffer()],
        SAFE_PROGRAM_ID
      )[0]

      const yesPubkey = new PublicKey(yesMint)
      const noPubkey = new PublicKey(noMint)

      const sourceMint = side === 'yes' ? noPubkey : yesPubkey
      const destMint = side === 'yes' ? yesPubkey : noPubkey

      await program.methods
        .swap(swapAmount)
        .accounts({
          user: publicKey,
          market: marketPubkey,
          outcomeYesMint: yesPubkey,
          outcomeNoMint: noPubkey,
          userSourceAta: getAssociatedTokenAddressSync(sourceMint, publicKey),
          userDestinationAta: getAssociatedTokenAddressSync(destMint, publicKey),
          vaultSourceAta: getAssociatedTokenAddressSync(sourceMint, vaultAuthority, true),
          vaultDestinationAta: getAssociatedTokenAddressSync(destMint, vaultAuthority, true),
          vaultAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc()

      setStatusMsg(`Successfully swapped to ${side.toUpperCase()}!`)
      await checkBalances()
      setTimeout(() => setStatusMsg(null), 4000)
    } catch (err: any) {
      setErrorMsg(err?.message || 'Swap failed.')
    } finally {
      setIsLoading(false)
    }
  }

  // Merge Shares (Exit to USDC)
  const maxMergeable = Math.min(userYesBalance, userNoBalance)
  const handleMergeShares = async () => {
    const { usdcMint, yesMint, noMint, marketId } = getKeys()
    if (!usdcMint || !yesMint || !noMint || !marketId || !publicKey) return

    if (amountNum <= 0 || amountNum > maxMergeable) {
      setErrorMsg(`Max mergeable amount is ${maxMergeable.toFixed(2)} pairs.`)
      return
    }

    setIsLoading(true)
    setErrorMsg(null)
    setStatusMsg(`Merging ${amountNum} YES + ${amountNum} NO pairs for ${amountNum} USDC...`)

    try {
      const connection = new Connection('https://api.devnet.solana.com', 'processed')
      const provider = new anchor.AnchorProvider(
        connection,
        { publicKey, signTransaction, signAllTransactions } as any,
        { commitment: 'processed' }
      )
      const program = new Program(rawIdl as any, provider as any) as any

      const mergeAmount = new anchor.BN(Math.floor(amountNum * 1_000_000))
      const marketPubkey = new PublicKey(marketId)
      const usdcPubkey = new PublicKey(usdcMint)
      const yesPubkey = new PublicKey(yesMint)
      const noPubkey = new PublicKey(noMint)

      const vaultAuthority = PublicKey.findProgramAddressSync(
        [Buffer.from('vault'), marketPubkey.toBuffer()],
        SAFE_PROGRAM_ID
      )[0]

      await program.methods
        .mergeShares(mergeAmount)
        .accounts({
          user: publicKey,
          market: marketPubkey,
          usdcMint: usdcPubkey,
          yesMint: yesPubkey,
          noMint: noPubkey,
          userUsdcAta: getAssociatedTokenAddressSync(usdcPubkey, publicKey),
          userYesAta: getAssociatedTokenAddressSync(yesPubkey, publicKey),
          userNoAta: getAssociatedTokenAddressSync(noPubkey, publicKey),
          vaultAuthority,
          vaultUsdcAta: getAssociatedTokenAddressSync(usdcPubkey, vaultAuthority, true),
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc()

      setStatusMsg(`Successfully merged shares for ${amountNum} USDC!`)
      closeUserPosition(publicKey.toBase58(), `${marketId}`, 'resolved-won')
      await checkBalances()
      setTimeout(() => setStatusMsg(null), 4000)
    } catch (err: any) {
      console.error('Merge shares failed:', err)
      setErrorMsg(err?.message || 'Merge failed.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!publicKey) {
    return (
      <div className="p-6 text-center text-textDim rounded-xl border border-border bg-bg/50">
        Please connect wallet to trade.
      </div>
    )
  }

  return (
    <div className="safe-bottom sticky bottom-0 z-30 rounded-xl border border-border bg-bg2/95 p-4 backdrop-blur-sm sm:p-5 lg:sticky lg:top-20 lg:bg-bg2 lg:backdrop-blur-none">
      {/* Mode navigation */}
      <div className="flex border-b border-border/80 pb-3 mb-4 gap-2">
        <button
          onClick={() => { setMode('buy'); setErrorMsg(null); }}
          className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded transition ${
            mode === 'buy' ? 'bg-cyan/15 text-cyan border border-cyan/40' : 'text-textDim hover:text-text'
          }`}
        >
          BUY (USDC)
        </button>
        <button
          onClick={() => { setMode('swap'); setErrorMsg(null); }}
          className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded transition ${
            mode === 'swap' ? 'bg-cyan/15 text-cyan border border-cyan/40' : 'text-textDim hover:text-text'
          }`}
        >
          SWAP
        </button>
        <button
          onClick={() => { setMode('merge'); setErrorMsg(null); setAmount(maxMergeable > 0 ? maxMergeable.toString() : '0'); }}
          className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded transition ${
            mode === 'merge' ? 'bg-purple/15 text-purple border border-purple/40' : 'text-textDim hover:text-text'
          }`}
        >
          EXIT / MERGE
        </button>
      </div>

      {/* Side selection (for Buy and Swap) */}
      {mode !== 'merge' && (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setSide('yes')}
            className={`min-h-[44px] rounded border text-xs font-semibold uppercase tracking-[0.06em] transition-colors ${
              side === 'yes' ? 'border-green bg-green/10 text-green shadow-glow-green' : 'border-border text-textDim'
            }`}
          >
            {mode === 'buy' ? 'BUY_YES' : 'SWAP → YES'}
          </button>
          <button
            onClick={() => setSide('no')}
            className={`min-h-[44px] rounded border text-xs font-semibold uppercase tracking-[0.06em] transition-colors ${
              side === 'no' ? 'border-pink bg-pink/10 text-pink shadow-glow-pink' : 'border-border text-textDim'
            }`}
          >
            {mode === 'buy' ? 'BUY_NO' : 'SWAP → NO'}
          </button>
        </div>
      )}

      {/* Input Field */}
      <div className="mt-4">
        <div className="flex justify-between items-center text-[11px] uppercase tracking-[0.06em] text-textDim">
          <label>
            {mode === 'buy'
              ? 'USDC AMOUNT TO INVEST'
              : mode === 'merge'
              ? 'PAIRS TO MERGE (1 YES + 1 NO = 1 USDC)'
              : `AMOUNT OF ${side === 'yes' ? 'NO' : 'YES'} TO SWAP`}
          </label>
          {mode === 'buy' && (
            <span>Balance: <strong className="text-text">{userUsdcBalance.toFixed(2)} USDC</strong></span>
          )}
          {mode === 'merge' && (
            <span>Max: <strong className="text-purple">{maxMergeable.toFixed(2)}</strong></span>
          )}
        </div>

        <input
          type="number"
          min="0"
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1.5 min-h-[44px] w-full rounded border border-border bg-bg px-3 text-sm text-text outline-none focus:border-cyan"
          placeholder="5"
        />

        {/* Quick presets */}
        {mode === 'merge' && maxMergeable > 0 && (
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setAmount((maxMergeable * 0.5).toFixed(2))}
              className="px-2 py-1 text-[10px] rounded border border-border text-textDim hover:border-purple hover:text-purple"
            >
              50%
            </button>
            <button
              onClick={() => setAmount(maxMergeable.toString())}
              className="px-2 py-1 text-[10px] rounded border border-border text-textDim hover:border-purple hover:text-purple"
            >
              MAX ({maxMergeable.toFixed(2)})
            </button>
          </div>
        )}
      </div>

      {/* Balances Strip */}
      <div className="mt-3 flex justify-between text-[10px] text-textDim border-t border-border/50 pt-2.5">
        <span>Your YES: <span className="text-green font-bold">{userYesBalance.toFixed(2)}</span></span>
        <span>Your NO: <span className="text-pink font-bold">{userNoBalance.toFixed(2)}</span></span>
      </div>

      {/* Status Messages */}
      {statusMsg && (
        <p className="mt-3 rounded border border-cyan/40 bg-cyan/10 px-3 py-2 text-xs text-cyan">
          {statusMsg}
        </p>
      )}
      {errorMsg && (
        <p className="mt-3 rounded border border-red/40 bg-red/10 px-3 py-2 text-xs text-red">
          {errorMsg}
        </p>
      )}

      {/* Primary Action Button */}
      {mode === 'buy' && (
        <Button
          variant={side === 'yes' ? 'yes' : 'no'}
          className="mt-4 w-full"
          onClick={handleBuyWithUsdc}
          disabled={isLoading || amountNum <= 0}
        >
          {isLoading ? 'PROCESSING 1-CLICK BUY...' : `BUY ${side.toUpperCase()} · ${amountNum || 0} USDC`}
        </Button>
      )}

      {mode === 'swap' && (
        <Button
          variant="primary"
          className="mt-4 w-full"
          onClick={handleSwapOnly}
          disabled={isLoading || amountNum <= 0}
        >
          {isLoading ? 'PROCESSING SWAP...' : `SWAP TO ${side.toUpperCase()}`}
        </Button>
      )}

      {mode === 'merge' && (
        <Button
          variant="secondary"
          className="mt-4 w-full border-purple text-purple hover:bg-purple/15"
          onClick={handleMergeShares}
          disabled={isLoading || amountNum <= 0 || amountNum > maxMergeable}
        >
          {isLoading ? 'MERGING SHARES...' : `MERGE · RECEIVE ${amountNum || 0} USDC`}
        </Button>
      )}
    </div>
  )
}