import Link from 'next/link'

const FOOTER_LINKS = [
  { label: 'DOCS', href: '#' },
  { label: 'GITHUB', href: '#' },
  { label: 'DISCORD', href: '#' },
  { label: 'TERMS', href: '#' },
]

export default function Footer() {
  return (
    <footer className="border-t border-border px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 text-xs text-textDim sm:flex-row sm:justify-between">
        <p className="uppercase tracking-[0.06em]">© 2026 SOLSTICE_PROTOCOL</p>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="uppercase tracking-[0.06em] transition-colors hover:text-cyan"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
