'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import MobileMenu from '@/components/layout/MobileMenu'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'

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

  const {connected, publicKey, disconnect} = useWallet()
  const { setVisible } = useWalletModal()
  const {connection} = useConnection()
  const [balance, setBalance] = useState<number | null>(null)
  
  useEffect(() => {
    if(publicKey && connected) {
      connection.getBalance(publicKey).then((bal) => {
        setBalance(bal / 1e9) // Convert lamports to SOL
      })
    }
  },[publicKey, connection])

  const handleWalletAction = () => {
    if(connected){
      disconnect()
    }else{
      setVisible(true)
    }
  }

  const buttonText = connected && publicKey
    ? `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`
    : 'CONNECT_WALLET'

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
            onClick={handleWalletAction}
            // TODO: wire up @solana/wallet-adapter
          >
            {buttonText}
          </Button>
          {/* <WalletMultiButton
            className="!rounded !border !border-cyan/30 !bg-cyan/10 !px-4 !py-2 !text-xs !font-semibold !uppercase !tracking-wider !text-cyan hover:!bg-cyan/20 transition"
          /> */}

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
