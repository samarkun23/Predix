'use client'

import Link from 'next/link'
import { useEffect } from 'react'

interface NavLink {
  label: string
  href: string
}

interface MobileMenuProps {
  links: NavLink[]
  open: boolean
  onClose: () => void
}

export default function MobileMenu({ links, open, onClose }: MobileMenuProps) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg/98 backdrop-blur-sm md:hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-4">
        <span className="text-sm font-semibold uppercase tracking-[0.08em] text-text">
          MENU
        </span>
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="flex h-11 w-11 items-center justify-center rounded border border-border text-textDim hover:text-cyan"
        >
          ✕
        </button>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-4 py-6">
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            onClick={onClose}
            className="flex min-h-[44px] items-center border-b border-border/60 text-base uppercase tracking-[0.06em] text-textDim transition-colors hover:text-cyan"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
