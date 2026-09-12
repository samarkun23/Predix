'use client'

import { useMemo, useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Connection } from '@solana/web3.js'
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'
import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import rawIdl from '@/idl/prediction_market_onchain.json'
import type { PoolState } from '@/lib/types'
import Button from '@/components/ui/Button'
import { quoteSwap } from '@/lib/amm'

const SAFE_PROGRAM_ID = new PublicKey("j3bfzTbouGfN1dUAcD81BpuzRKXt1jjqxJ86rk4ZybA");

interface SwapPanelProps {
  market: any
  pool: PoolState
}

export default function SwapPanel({ market, pool }: SwapPanelProps) {
  const { publicKey, signTransaction, signAllTransactions } = useWallet()
  
  const [side, setSide] = useState<'yes' | 'no'>('yes')
  const [amount, setAmount] = useState('2')
  const [isLoading, setIsLoading] = useState(false)
  const [userYesBalance, setUserYesBalance] = useState(0)
  const [userNoBalance, setUserNoBalance] = useState(0)
  const [isDataReady, setIsDataReady] = useState(false)

  // ✅ SAFE Balance Check - Only runs when market data is ready
  useEffect(() => {
    const checkBalances = async () => {
      if (!publicKey) {
        console.log("❌ No publicKey connected");
        return;
      }
      
      if (!market) {
        console.log("❌ No market data");
        return;
      }

      try {
        // Safely extract account data
        const acc = market.account || market;
        
        // Check if we have the required fields
        if (!acc) {
          console.log("❌ No account data in market object");
          return;
        }

        // Try both camelCase and snake_case, ensure they exist
        const yesMintRaw = acc.outcomeYesMint || acc.outcome_yes_mint;
        const noMintRaw = acc.outcomeNoMint || acc.outcome_no_mint;

        if (!yesMintRaw || !noMintRaw) {
          console.log("❌ Mint addresses missing:", { yesMintRaw, noMintRaw });
          console.log("Full account data:", acc);
          return;
        }

        // Convert to string safely
        let yesMintStr: string;
        let noMintStr: string;
        
        try {
          yesMintStr = typeof yesMintRaw === 'string' ? yesMintRaw : yesMintRaw.toString();
          noMintStr = typeof noMintRaw === 'string' ? noMintRaw : noMintRaw.toString();
        } catch (e) {
          console.log("❌ Failed to convert mints to string:", e);
          return;
        }

        console.log("✅ Mint addresses found:", { yesMintStr, noMintStr });

        const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
        const yesMint = new PublicKey(yesMintStr);
        const noMint = new PublicKey(noMintStr);

        const yesAta = getAssociatedTokenAddressSync(yesMint, publicKey);
        const noAta = getAssociatedTokenAddressSync(noMint, publicKey);
        
        console.log("ATAs:", { 
          yesAta: yesAta.toBase58(), 
          noAta: noAta.toBase58() 
        });

        const yesInfo = await connection.getAccountInfo(yesAta);
        const noInfo = await connection.getAccountInfo(noAta);
        
        let yesBal = 0;
        let noBal = 0;

        if (yesInfo) {
          const balance = await connection.getTokenAccountBalance(yesAta);
          yesBal = Number(balance.value.amount) / 1_000_000;
        }
        
        if (noInfo) {
          const balance = await connection.getTokenAccountBalance(noAta);
          noBal = Number(balance.value.amount) / 1_000_000;
        }
        
        console.log("✅ Balances found:", { yesBal, noBal });
        setUserYesBalance(yesBal);
        setUserNoBalance(noBal);
        setIsDataReady(true);
        
      } catch (err: any) {
        console.error('❌ Error checking balances:', err.message);
        console.error('Full error:', err);
      }
    }
    
    checkBalances();
  }, [publicKey, market])

  const amountNum = parseFloat(amount) || 0
  const quote = useMemo(() => quoteSwap(pool, side, amountNum), [pool, side, amountNum])

  const getKeys = () => {
    if (!market) return { usdcMint: '', yesMint: '', noMint: '', marketId: '' };
    const acc = market.account || market;
    return {
      usdcMint: acc.usdcMint?.toString() || acc.usdc_mint?.toString() || '',
      yesMint: acc.outcomeYesMint?.toString() || acc.outcome_yes_mint?.toString() || '',
      noMint: acc.outcomeNoMint?.toString() || acc.outcome_no_mint?.toString() || '',
      marketId: market.id?.toString() || market.publicKey?.toString() || ''
    };
  }

  const handleMint = async () => {
    const { usdcMint, yesMint, noMint, marketId } = getKeys();
    if (!usdcMint || !yesMint || !noMint || !marketId) {
      alert('Market data missing. Please refresh the page.');
      return;
    }

    setIsLoading(true);
    try {
      const connection = new Connection("https://api.devnet.solana.com", "processed");
      const provider = new anchor.AnchorProvider(connection, { publicKey, signTransaction, signAllTransactions } as any, { commitment: "processed" });
      const program = new Program(rawIdl as any, provider as any) as any;
      
      const amountLamports = new anchor.BN(amountNum * 1_000_000);
      const marketPubkey = new PublicKey(marketId);
      const vaultAuthority = PublicKey.findProgramAddressSync([Buffer.from('vault'), marketPubkey.toBuffer()], SAFE_PROGRAM_ID)[0];

      await program.methods.mintShares(amountLamports).accounts({
        user: publicKey, market: marketPubkey,
        usdcMint: new PublicKey(usdcMint), yesMint: new PublicKey(yesMint), noMint: new PublicKey(noMint),
        userUsdcAta: getAssociatedTokenAddressSync(new PublicKey(usdcMint), publicKey!),
        userYesAta: getAssociatedTokenAddressSync(new PublicKey(yesMint), publicKey!),
        userNoAta: getAssociatedTokenAddressSync(new PublicKey(noMint), publicKey!),
        vaultAuthority, vaultUsdcAta: getAssociatedTokenAddressSync(new PublicKey(usdcMint), vaultAuthority, true),
        tokenProgram: TOKEN_PROGRAM_ID, associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      }).rpc();

      alert('Shares Minted Successfully!');
      window.location.reload();
    } catch (error: any) {
      alert(`Mint Failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSwap = async () => {
    const { yesMint, noMint, marketId } = getKeys();
    if (!yesMint || !noMint || !marketId) {
      alert('Market data missing. Please refresh.');
      return;
    }

    // Check balances
    console.log("Current balances:", { userYesBalance, userNoBalance });
    
    if (side === 'yes' && userNoBalance <= 0) {
      alert(`You need NO shares to buy YES!\nYour NO balance: ${userNoBalance}\nPlease Mint first.`);
      return;
    }
    if (side === 'no' && userYesBalance <= 0) {
      alert(`You need YES shares to buy NO!\nYour YES balance: ${userYesBalance}\nPlease Mint first.`);
      return;
    }

    setIsLoading(true);
    try {
      const connection = new Connection("https://api.devnet.solana.com", "processed");
      const provider = new anchor.AnchorProvider(connection, { publicKey, signTransaction, signAllTransactions } as any, { commitment: "processed" });
      const program = new Program(rawIdl as any, provider as any) as any;
      
      const swapAmount = new anchor.BN(amountNum * 1_000_000); 
      const marketPubkey = new PublicKey(marketId);
      const vaultAuthority = PublicKey.findProgramAddressSync([Buffer.from('vault'), marketPubkey.toBuffer()], SAFE_PROGRAM_ID)[0];

      const sourceMint = side === 'yes' ? noMint : yesMint;
      const destMint = side === 'yes' ? yesMint : noMint;

      await program.methods.swap(swapAmount).accounts({
        user: publicKey, market: marketPubkey,
        outcomeYesMint: new PublicKey(yesMint), outcomeNoMint: new PublicKey(noMint),
        userSourceAta: getAssociatedTokenAddressSync(new PublicKey(sourceMint), publicKey!),
        userDestinationAta: getAssociatedTokenAddressSync(new PublicKey(destMint), publicKey!),
        vaultSourceAta: getAssociatedTokenAddressSync(new PublicKey(sourceMint), vaultAuthority, true),
        vaultDestinationAta: getAssociatedTokenAddressSync(new PublicKey(destMint), vaultAuthority, true),
        vaultAuthority, tokenProgram: TOKEN_PROGRAM_ID,
      }).rpc();

      alert(`Successfully Bought ${side.toUpperCase()}!`);
      window.location.reload();
    } catch (error: any) {
      alert(`Swap Failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  if (!publicKey) {
    return <div className="p-6 text-center text-textDim rounded-xl border border-border bg-bg/50">Please connect wallet</div>
  }

  return (
    <div className="safe-bottom sticky bottom-0 z-30 rounded-xl border border-border bg-bg2/95 p-4 backdrop-blur-sm sm:p-5 lg:sticky lg:top-20 lg:bg-bg2 lg:backdrop-blur-none">
      
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
        AMOUNT (SHARES)
      </label>
      <input
        type="number"
        min="0"
        step="1"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="mt-1.5 min-h-[44px] w-full rounded border border-border bg-bg px-3 text-sm text-text outline-none focus:border-cyan"
      />

      <div className="mt-3 flex justify-between text-[10px] text-textDim">
        <span>Your YES: <span className="text-green font-bold">{userYesBalance.toFixed(2)}</span></span>
        <span>Your NO: <span className="text-pink font-bold">{userNoBalance.toFixed(2)}</span></span>
      </div>

      <Button
        variant={side === 'yes' ? 'primary' : 'secondary'}
        className="mt-4 w-full"
        onClick={handleSwap}
        disabled={isLoading || !amount || amountNum <= 0}
      >
        {isLoading ? 'PROCESSING...' : `SWAP · BUY_${side.toUpperCase()}`}
      </Button>

      <div className="my-4 flex items-center gap-2">
        <div className="h-px flex-1 bg-border"></div>
        <span className="text-[10px] uppercase text-textDim">Need shares?</span>
        <div className="h-px flex-1 bg-border"></div>
      </div>

      <Button
        variant="ghost"
        className="w-full border border-border text-textDim hover:text-white"
        onClick={handleMint}
        disabled={isLoading || !amount || amountNum <= 0}
      >
        MINT · GET SHARES (USDC)
      </Button>

    </div>
  )
}