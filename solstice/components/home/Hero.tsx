import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function Hero() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-14 pt-14 sm:px-6 sm:pt-20 lg:pt-24">
      <div className="inline-flex items-center gap-2 rounded-sm border border-border bg-panel px-3 py-1.5 text-[11px] uppercase tracking-[0.06em] text-textDim">
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-cyan" />
        LIVE_ON_SOLANA_DEVNET
      </div>

      <h1 className="mt-6 max-w-3xl text-3xl font-bold leading-[1.1] tracking-tight text-text sm:text-4xl md:text-5xl lg:text-6xl">
        Trade the outcome
        <br />
        <span
          className="bg-gradient-to-r from-pink via-purple to-cyan bg-clip-text text-transparent"
        >
          of anything, on-chain.
        </span>
      </h1>

      <p className="mt-6 max-w-xl text-sm text-textDim sm:text-base">
        Solstice is a non-custodial prediction market protocol on Solana.
        Provide liquidity, take a side, settle instantly — no intermediaries,
        no custody, no delay.
      </p>

      <div className="mt-8 flex flex-col gap-3 xs:flex-row">
        <Button variant="primary" className="w-full xs:w-auto">
          LAUNCH_APP
        </Button>
        <Link href="/create" className="w-full xs:w-auto">
          <Button variant="secondary" className="w-full">
            CREATE_MARKET
          </Button>
        </Link>
      </div>
    </section>
  )
}
