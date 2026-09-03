'use client'

import { useState } from 'react'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import MobileMenu from '@/components/layout/MobileMenu'

const NAV_LINKS = [
  { label: 'MARKETS', href: '/' },
  { label: 'PORTFOLIO', href: '/portfolio' },
  { label: 'CREATE', href: '/create' },
  { label: 'DOCS', href: '#' },
]

interface NavbarProps {
  onConnectWallet?: () => void
}

export default function Navbar({ onConnectWallet }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-base font-bold uppercase tracking-[0.08em] text-text sm:text-lg">
            PRE<span className="text-cyan">DIX</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-xs uppercase tracking-[0.06em] text-textDim transition-colors hover:text-cyan"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Badge variant="network" className="hidden xs:inline-flex">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-green" />
            <span className="hidden sm:inline">SOLANA_DEVNET</span>
            <span className="sm:hidden">DEVNET</span>
          </Badge>

          <Button
            variant="primary"
            className="!min-h-0 !px-3 !py-2 text-[11px] sm:!px-4 sm:text-xs"
            onClick={onConnectWallet}
            // TODO: wire up @solana/wallet-adapter
          >
            CONNECT_WALLET
          </Button>

          <button
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded border border-border text-textDim hover:text-cyan md:hidden"
          >
            <span className="flex flex-col gap-1">
              <span className="block h-px w-4 bg-current" />
              <span className="block h-px w-4 bg-current" />
              <span className="block h-px w-4 bg-current" />
            </span>
          </button>
        </div>
      </div>

      <MobileMenu links={NAV_LINKS} open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  )
}
