import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ProbabilityBar from '@/components/home/ProbabilityBar'
import { CATEGORY_BADGE_VARIANT, CATEGORY_LABEL } from '@/components/home/CategoryStyles'

interface MarketCardProps {
  marketData: any,
  detectedCategory: 'crypto' | 'politics' | 'sports' | 'other'
}

export default function MarketCard({ marketData, detectedCategory }: MarketCardProps) {
  if (!marketData || !marketData.account) {
    return null; // or some fallback UI
  }

  const account = marketData.account;

  const marketPublickKey = marketData.publicKey;

  // resolution times into days
  const resolutionTime = account.resolutionTime.toNumber() * 1000
  const daysLeft = Math.max(0, Math.round((resolutionTime - Date.now()) / (1000 * 60 * 60 * 24)))

  // status badge decide
  let statusBadge = (
    <span className='rounded text-green border-green/40 bg-green/10 px-2 py-1 text-[10px] font-bold uppercase'>
      ACTIVE
    </span>
  )
  let daysText = `${daysLeft}d left`

  if(account.isResolved){
    if(account.isDisputed){
      statusBadge = (
        <span className='rounded bg-red/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-red'>
          DISPUTED
        </span>
      )
      daysText = 'Frozen'
    }else {
      statusBadge = (
        <span className='rounded bg-red/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-red'>
          RESOLVED
        </span>
      )
      daysText = account.winningOutcome === 1 ? 'YES Won' : 'NO Won' // TODO: need to check this 
    }
  }

  const categoryVariant = CATEGORY_BADGE_VARIANT?.[detectedCategory] || 'default'
  const categoryLabel = CATEGORY_LABEL?.[detectedCategory] || detectedCategory.toUpperCase()

  return (
     <Link href={`/markets/${marketPublickKey}`}>
      <div className="group cursor-pointer rounded-xl border border-border bg-bg/50 p-6 transition hover:border-cyan/50 hover:bg-bg/80 h-full flex flex-col">
        <div className="mb-4 flex items-center justify-between">
          <Badge variant={categoryVariant}>
            {categoryLabel}
          </Badge>
          {statusBadge}
          <span className="text-xs text-textDim">{daysText}</span>
        </div>
        
        <h3 className="mb-4 text-lg font-bold leading-snug text-white group-hover:text-cyan transition flex-1">
          {account.question}
        </h3>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs text-textDim">
          <span className="truncate max-w-[150px]">
            Source: {account.oracleSource ? account.oracleSource.split('|')[0].replace('https://', '').trim().slice(0, 20) + "..." : "Manual"}...
          </span>
          <span className="text-cyan font-medium group-hover:translate-x-1 transition-transform">
            Trade Now →
          </span>
        </div>
      </div>
    </Link>
  )
}
