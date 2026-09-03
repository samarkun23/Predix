// TODO: gate this route to admin wallet only
import CreateMarketForm from '@/components/create-market/CreateMarketForm'

export default function CreateMarketPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="section-head text-sm font-semibold uppercase tracking-[0.06em] text-text">
        CREATE_MARKET
      </h1>
      <p className="mt-2 max-w-lg text-xs text-textDim">
        Deploy a new prediction market on-chain. Liquidity you seed here becomes the
        initial pool for YES/NO trading.
      </p>

      <div className="mt-8">
        <CreateMarketForm />
      </div>
    </div>
  )
}
