'use client'

import { useMemo, useState } from 'react'
import * as anchor from '@coral-xyz/anchor'
import type { MarketCategory } from '@/lib/types'
import QuestionField from '@/components/create-market/QuestionField'
import CategorySelect from '@/components/create-market/CategorySelect'
import ResolutionDateField from '@/components/create-market/ResolutionDateField'
import LiquidityField from '@/components/create-market/LiquidityField'
import OracleSourceField from '@/components/create-market/OracleSourceField'
import FormSummaryPanel from '@/components/create-market/FormSummaryPanel'
import SubmitBar from '@/components/create-market/SubmitBar'
import { useWallet } from '@solana/wallet-adapter-react'
import { getProgram, getVaultAuthority } from '@/lib/anchor'
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js'
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token'

function daysUntil(dateStr: string): number {
  if (!dateStr) return 0
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)))
}

export default function CreateMarketForm() {
  const { publicKey, signTransaction , signAllTransactions} = useWallet()

  const [question, setQuestion] = useState('')
  const [category, setCategory] = useState<MarketCategory>('crypto')
  const [resolutionDate, setResolutionDate] = useState('')
  const [liquidity, setLiquidity] = useState('')
  const [oracleSource, setOracleSource] = useState('')
  const [successTx, setSuccessTx] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const endsInDays = useMemo(() => daysUntil(resolutionDate), [resolutionDate])

  const isValid =
    question.trim().length > 8 &&
    resolutionDate.length > 0 &&
    parseFloat(liquidity) > 0 &&
    oracleSource.trim().length > 4

  async function handleSubmit() {
    if (!isValid || !publicKey || !signTransaction || !signAllTransactions) {
      setError('Please connect your wallet and fill all fields.')
      return;
    }

    setIsLoading(true)
    setError(null)

    try {
      const program = getProgram(publicKey, signTransaction, signAllTransactions);

      // inputs
      const marketId = new anchor.BN(Date.now());
      const resolutionTime = new anchor.BN(Math.floor(new Date(resolutionDate).getTime() / 1000));
      const questionString = question.trim();

      // catagory with orcale string 
      const categoryTag = ` | C:${category}`;
      const oracleSourceString = oracleSource.trim().length > 0 ? oracleSource.trim() + categoryTag : `Manual Resolution${categoryTag}`;


      // PDA & keypair
      const [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('market'), publicKey.toBuffer(), marketId.toArrayLike(Buffer, 'le', 8)],
        program.programId
      );
      const vaultAuthority = getVaultAuthority(marketPda);
      const yesMintKeypair = Keypair.generate();
      const noMintKeypair = Keypair.generate();

      // devnet usdc mint address 
      const usdcMint = new anchor.web3.PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

      // vault atas
      const vaultUsdcAta = getAssociatedTokenAddressSync(usdcMint, vaultAuthority, true);
      const vaultYesAta = getAssociatedTokenAddressSync(yesMintKeypair.publicKey, vaultAuthority, true);
      const vaultNoAta = getAssociatedTokenAddressSync(noMintKeypair.publicKey, vaultAuthority, true);

      // trx build and send 
      const tx = await program.methods
        .createMarket(
          marketId,
          publicKey,
          resolutionTime,
          questionString,
          oracleSourceString,
        )
        .accounts({
          admin: publicKey,
          market: marketPda,
          usdcMint: usdcMint,
          outcomeYesMint: yesMintKeypair.publicKey,
          outcomeNoMint: noMintKeypair.publicKey,
          vaultAuthority: vaultAuthority,
          vaultUsdcAta: vaultUsdcAta,
          vaultYesAta: vaultYesAta,
          vaultNoAta: vaultNoAta,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .signers([yesMintKeypair, noMintKeypair])
        .rpc();

        console.log('Market created with tx:', tx)
        setSuccessTx(tx)

        // form reset
        setQuestion('')
        setResolutionDate('')
        setLiquidity('')
        setOracleSource('')

    } catch (err) {
      console.error('Error creating market:', err) 
      setError('An error occurred while creating the market.')
    }finally{
      setIsLoading(false)
    }
  }

  function handleDiscard() {
    setQuestion('')
    setResolutionDate('')
    setLiquidity('')
    setOracleSource('')
    setSuccessTx(null)
    setError(null)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-8">
      <div className="flex flex-col gap-5 pb-24 lg:col-span-3 lg:pb-0">
        <QuestionField value={question} onChange={setQuestion} />
        <CategorySelect value={category} onChange={setCategory} />
        <ResolutionDateField value={resolutionDate} onChange={setResolutionDate} />
        <LiquidityField value={liquidity} onChange={setLiquidity} />
        <OracleSourceField value={oracleSource} onChange={setOracleSource} />

        {successTx && (
          <p className="rounded border border-green/40 bg-green/10 px-3 py-2.5 text-xs text-green">
            &gt; MARKET_DEPLOYED · tx: {successTx.slice(0,8)}...{successTx.slice(-8)}
          </p>
        )}
        {
          error && (
            <p className="rounded border border-red/40 bg-red/10 px-3 py-2.5 text-xs text-red">
              &gt; ERROR · {error}
            </p>
          )
        }
      </div>

      <div className="lg:col-span-2">
        <FormSummaryPanel
          question={question}
          category={category}
          liquidity={liquidity}
          endsInDays={endsInDays}
        />
      </div>

      <div className="lg:col-span-5">
        <SubmitBar isValid={isValid} isLoading={isLoading} onDiscard={handleDiscard} onSubmit={handleSubmit} />
      </div>
    </div>
  )
}
