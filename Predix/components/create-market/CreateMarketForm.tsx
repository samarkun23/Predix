'use client'

import { useMemo, useState } from 'react'
import type { MarketCategory } from '@/lib/types'
import QuestionField from '@/components/create-market/QuestionField'
import CategorySelect from '@/components/create-market/CategorySelect'
import ResolutionDateField from '@/components/create-market/ResolutionDateField'
import LiquidityField from '@/components/create-market/LiquidityField'
import OracleSourceField from '@/components/create-market/OracleSourceField'
import FormSummaryPanel from '@/components/create-market/FormSummaryPanel'
import SubmitBar from '@/components/create-market/SubmitBar'

function daysUntil(dateStr: string): number {
  if (!dateStr) return 0
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)))
}

export default function CreateMarketForm() {
  const [question, setQuestion] = useState('')
  const [category, setCategory] = useState<MarketCategory>('crypto')
  const [resolutionDate, setResolutionDate] = useState('')
  const [liquidity, setLiquidity] = useState('')
  const [oracleSource, setOracleSource] = useState('')
  const [successTx, setSuccessTx] = useState<string | null>(null)

  const endsInDays = useMemo(() => daysUntil(resolutionDate), [resolutionDate])

  const isValid =
    question.trim().length > 8 &&
    resolutionDate.length > 0 &&
    parseFloat(liquidity) > 0 &&
    oracleSource.trim().length > 4

  function handleSubmit() {
    if (!isValid) return
    const payload = { question, category, resolutionDate, liquidity, oracleSource }
    // eslint-disable-next-line no-console
    console.log('DEPLOY_MARKET payload:', payload)
    const tx = Math.random().toString(16).slice(2, 6) + '...' + Math.random().toString(16).slice(2, 6)
    setSuccessTx(tx)
    setTimeout(() => setSuccessTx(null), 4000)
  }

  function handleDiscard() {
    setQuestion('')
    setResolutionDate('')
    setLiquidity('')
    setOracleSource('')
    setSuccessTx(null)
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
            &gt; MARKET_DEPLOYED · tx: {successTx}
          </p>
        )}
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
        <SubmitBar isValid={isValid} onDiscard={handleDiscard} onSubmit={handleSubmit} />
      </div>
    </div>
  )
}
