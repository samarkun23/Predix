import type { MarketCategory } from '@/lib/types'
import Badge from '@/components/ui/Badge'
import { CATEGORY_BADGE_VARIANT, CATEGORY_LABEL } from '@/components/home/CategoryStyles'

interface CategorySelectProps {
  value: MarketCategory
  onChange: (value: MarketCategory) => void
}

const CATEGORIES: MarketCategory[] = ['crypto', 'politics', 'sports']

export default function CategorySelect({ value, onChange }: CategorySelectProps) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-[0.06em] text-textDim">CATEGORY</label>
      <div className="no-scrollbar mt-1.5 flex gap-2 overflow-x-auto">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            className={`min-h-[40px] shrink-0 rounded-sm transition-opacity xs:min-h-[44px] ${
              value === category ? 'opacity-100' : 'opacity-45 hover:opacity-70'
            }`}
          >
            <Badge variant={CATEGORY_BADGE_VARIANT[category]} className="px-2.5 py-2 text-[11px] xs:px-3">
              {CATEGORY_LABEL[category]}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  )
}
