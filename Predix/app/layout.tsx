import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import {WalletProvider} from '@/components/providers/WalletProvider'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  title: 'Solstice — Decentralized Prediction Markets on Solana',
  description:
    'Trade the outcome of anything. Non-custodial, on-chain prediction markets built on Solana.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <body className="font-mono antialiased">
        <div className="bg-glow" />
        <div className="bg-grid" />
        <div className="relative z-10 flex min-h-screen flex-col">
          <WalletProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </WalletProvider>
        </div>
      </body>
    </html>
  )
}
