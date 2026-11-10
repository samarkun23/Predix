'use client'

import { useState } from 'react'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'

type DocSection = 'overview' | 'amm' | 'lifecycle' | 'instructions' | 'guide' | 'faq'

const SECTIONS: { id: DocSection; label: string; badge?: string }[] = [
  { id: 'overview', label: '1. PROTOCOL_OVERVIEW' },
  { id: 'amm', label: '2. AMM_&_TRADING_MATH' },
  { id: 'lifecycle', label: '3. MARKET_LIFECYCLE' },
  { id: 'instructions', label: '4. CONTRACT_REFERENCE', badge: 'v1.0' },
  { id: 'guide', label: '5. USER_&_DEV_GUIDE' },
  { id: 'faq', label: '6. PROTOCOL_FAQ' },
]

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<DocSection>('overview')

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Header Banner */}
      <div className="border-b border-border pb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan animate-pulse-dot" />
              <span className="text-xs font-bold uppercase tracking-widest text-cyan">PREDIX PROTOCOL SPECIFICATION</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold uppercase tracking-tight text-text sm:text-3xl">
              DOCUMENTATION &amp; ARCHITECTURE
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="network">SOLANA DEVNET</Badge>
            <Badge variant="info">ANCHOR 0.32.1</Badge>
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-textDim">
          Comprehensive technical reference for Predix — a fully decentralized, non-custodial prediction market protocol powered by Solana smart contracts, automated market makers (CPMM), and dispute-governed resolution.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Navigation Sidebar */}
        <aside className="lg:col-span-3">
          <div className="sticky top-24 rounded border border-border bg-bg2 p-3 sm:p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-textFaint mb-3 px-2">
              SECTIONS
            </div>
            <nav className="flex flex-col gap-1">
              {SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`flex items-center justify-between rounded px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider transition ${
                    activeSection === sec.id
                      ? 'border border-cyan/40 bg-cyan/15 text-cyan shadow-glow-cyan'
                      : 'text-textDim hover:bg-white/5 hover:text-text'
                  }`}
                >
                  <span>{sec.label}</span>
                  {sec.badge && (
                    <span className="rounded bg-border/60 px-1.5 py-0.5 text-[9px] font-mono text-cyan">
                      {sec.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div className="mt-6 border-t border-border pt-4 px-2 text-[11px] text-textFaint">
              <span className="block font-mono text-textDim truncate">PROGRAM ID:</span>
              <span className="block font-mono text-[10px] text-cyan break-all">
                j3bfzTbouGfN1dUAcD81BpuzRKXt1jjqxJ86rk4ZybA
              </span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-9 space-y-12">
          {/* SECTION 1: OVERVIEW */}
          {activeSection === 'overview' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-wider text-text flex items-center gap-2">
                  <span className="text-cyan">01.</span> PROTOCOL OVERVIEW
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-textDim">
                  Predix allows anyone to trade on the outcome of real-world events. Every market is backed by 100% full collateral (USDC) secured on-chain in program-controlled Vault Program Derived Addresses (PDAs).
                </p>
              </div>

              {/* Core Principles Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded border border-border bg-bg2 p-4">
                  <div className="text-cyan font-bold text-xs uppercase tracking-wider">// 100% Fully Collateralized</div>
                  <p className="mt-2 text-xs text-textDim leading-relaxed">
                    Every pair of outcome tokens (1 YES + 1 NO) is backed by exactly 1.00 USDC deposited in the market vault PDA. There is zero algorithmic leverage or fractional backing.
                  </p>
                </div>

                <div className="rounded border border-border bg-bg2 p-4">
                  <div className="text-green font-bold text-xs uppercase tracking-wider">// Automated Liquidity Pools</div>
                  <p className="mt-2 text-xs text-textDim leading-relaxed">
                    Trades execute instantly against an on-chain Constant Product Market Maker (CPMM). No order books, off-chain matching engines, or market maker APIs required.
                  </p>
                </div>

                <div className="rounded border border-border bg-bg2 p-4">
                  <div className="text-pink font-bold text-xs uppercase tracking-wider">// 48-Hour Dispute Challenge</div>
                  <p className="mt-2 text-xs text-textDim leading-relaxed">
                    When an oracle resolves an event, a 48-hour dispute window opens. Any trader can flag erroneous or malicious resolutions before payouts are unlocked.
                  </p>
                </div>

                <div className="rounded border border-border bg-bg2 p-4">
                  <div className="text-purple font-bold text-xs uppercase tracking-wider">// Pre-Resolution Exit (Merge)</div>
                  <p className="mt-2 text-xs text-textDim leading-relaxed">
                    Traders do not need to wait until market expiration to exit. Users can merge matching pairs (1 YES + 1 NO) to withdraw USDC anytime prior to resolution.
                  </p>
                </div>
              </div>

              {/* High-Level Architecture Diagram */}
              <div className="rounded border border-border bg-bg2 p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text">PROTOCOL ARCHITECTURE</h3>
                <div className="mt-4 rounded bg-bg p-4 font-mono text-xs text-textDim overflow-x-auto space-y-2">
                  <p className="text-cyan font-semibold">User Wallet (Trader / LP)</p>
                  <p> │── Deposits USDC ─────────► [ Market Vault ATA (PDA: b&quot;vault&quot;, market_pubkey) ]</p>
                  <p> │◄── Mints / Swaps ───────► [ Outcome YES Mint / Outcome NO Mint ]</p>
                  <p> │── Trades Shares ────────► [ Constant Product AMM Pool (x * y = k) ]</p>
                  <p> └── Redeems Winnings ─────► Burns Winning Tokens ──► Receives 1.00 USDC / Share</p>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 2: AMM & TRADING MATH */}
          {activeSection === 'amm' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-wider text-text flex items-center gap-2">
                  <span className="text-cyan">02.</span> AMM &amp; TRADING MATHEMATICS
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-textDim">
                  Predix utilizes a Constant Product Market Maker (CPMM) adapted for bounded binary outcome tokens.
                </p>
              </div>

              {/* Spot Price Math */}
              <div className="rounded border border-border bg-bg2 p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text">SPOT PRICE DERIVATION</h3>
                <p className="text-xs text-textDim leading-relaxed">
                  The probability of an outcome is directly proportional to the relative reserves of the opposite outcome token in the liquidity pool:
                </p>
                <div className="rounded bg-bg p-4 font-mono text-xs text-cyan space-y-2">
                  <p className="font-bold">Price(YES) = Reserve(NO) / (Reserve(YES) + Reserve(NO))</p>
                  <p className="font-bold">Price(NO)  = Reserve(YES) / (Reserve(YES) + Reserve(NO))</p>
                  <p className="text-textDim text-[11px]">// Note: Price(YES) + Price(NO) always equals exactly 1.00 (100¢)</p>
                </div>
              </div>

              {/* Swap Output Calculation */}
              <div className="rounded border border-border bg-bg2 p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text">SWAP OUTPUT WITH FEES (0.30%)</h3>
                <p className="text-xs text-textDim leading-relaxed">
                  When a trader swaps outcome tokens into the AMM, the contract enforces the invariant:
                </p>
                <div className="rounded bg-bg p-4 font-mono text-xs text-text space-y-1">
                  <p className="text-green font-bold">(Reserve_In + Amount_In_After_Fee) * (Reserve_Out - Amount_Out) = Reserve_In * Reserve_Out</p>
                  <p className="text-textDim mt-2">Amount_Out = (Amount_In_After_Fee * Reserve_Out) / (Reserve_In + Amount_In_After_Fee)</p>
                  <p className="text-textFaint">Fee = Amount_In * 30 / 10,000 (0.30% fee stays in pool reserves rewarding LPs)</p>
                </div>
              </div>

              {/* 1-Click USDC Buy Flow */}
              <div className="rounded border border-border bg-bg2 p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text">1-CLICK USDC BUY BUNDLING</h3>
                <p className="text-xs text-textDim leading-relaxed">
                  In traditional binary protocols, users must manually mint tokens with collateral before swapping. Predix bundles this into a single atomic Solana transaction:
                </p>
                <ol className="list-decimal list-inside text-xs text-textDim space-y-1.5 pl-2 font-mono">
                  <li><strong className="text-text">mint_shares(USDC)</strong>: Deposits $X USDC into vault; mints $X YES and $X NO tokens to user.</li>
                  <li><strong className="text-text">swap(counter_shares)</strong>: Immediately swaps the unwanted counter-outcome shares into the user&apos;s desired outcome via the AMM.</li>
                  <li>User receives target outcome tokens with 1 signature and 0 intermediary steps!</li>
                </ol>
              </div>
            </section>
          )}

          {/* SECTION 3: MARKET LIFECYCLE */}
          {activeSection === 'lifecycle' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-wider text-text flex items-center gap-2">
                  <span className="text-cyan">03.</span> COMPLETE MARKET LIFECYCLE
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-textDim">
                  Every prediction market progresses through distinct, deterministic phases enforced by Solana smart contract guards.
                </p>
              </div>

              <div className="space-y-4">
                {/* Phase 1 */}
                <div className="rounded border border-border bg-bg2 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan">
                    <span className="rounded bg-cyan/15 px-2 py-0.5 text-[10px]">PHASE 1</span>
                    CREATION &amp; INITIAL SEEDING
                  </div>
                  <p className="mt-2 text-xs text-textDim leading-relaxed">
                    Creator defines question, resolution deadline, designated oracle address, and initial seed liquidity. The program initializes the Market PDA, vault authority, and generates unique YES and NO SPL mint keypairs.
                  </p>
                </div>

                {/* Phase 2 */}
                <div className="rounded border border-border bg-bg2 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green">
                    <span className="rounded bg-green/15 px-2 py-0.5 text-[10px]">PHASE 2</span>
                    ACTIVE TRADING &amp; LIQUIDITY
                  </div>
                  <p className="mt-2 text-xs text-textDim leading-relaxed">
                    Traders buy YES or NO shares, swap between positions, or provide liquidity. Users can exit early anytime by merging matching shares (`merge_shares`).
                  </p>
                </div>

                {/* Phase 3 */}
                <div className="rounded border border-border bg-bg2 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple">
                    <span className="rounded bg-purple/15 px-2 py-0.5 text-[10px]">PHASE 3</span>
                    ORACLE RESOLUTION
                  </div>
                  <p className="mt-2 text-xs text-textDim leading-relaxed">
                    Once the clock reaches `resolution_time`, the designated oracle submits `resolve_market(outcome)`. Outcomes: <strong>1 (YES)</strong>, <strong>2 (NO)</strong>, or <strong>3 (VOID/REFUND)</strong>. Minting, swapping, and adding liquidity are permanently frozen.
                  </p>
                </div>

                {/* Phase 4 */}
                <div className="rounded border border-border bg-bg2 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber">
                    <span className="rounded bg-amber/15 px-2 py-0.5 text-[10px]">PHASE 4</span>
                    48-HOUR DISPUTE WINDOW
                  </div>
                  <p className="mt-2 text-xs text-textDim leading-relaxed">
                    A 48-hour challenge countdown timer begins immediately upon resolution. Any user can call `dispute_market()`. If disputed, funds are frozen until the market admin reviews the real-world evidence and calls `resolve_dispute()`.
                  </p>
                </div>

                {/* Phase 5 */}
                <div className="rounded border border-border bg-bg2 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan">
                    <span className="rounded bg-cyan/15 px-2 py-0.5 text-[10px]">PHASE 5</span>
                    PAYOUT REDEMPTION
                  </div>
                  <p className="mt-2 text-xs text-textDim leading-relaxed">
                    Once the dispute window elapses, `redeem()` unlocks. Token holders burn their winning tokens and receive 1.00 USDC per share directly from the vault (or 0.50 USDC per share in case of a VOID/cancelled market).
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 4: INSTRUCTIONS REFERENCE */}
          {activeSection === 'instructions' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-wider text-text flex items-center gap-2">
                  <span className="text-cyan">04.</span> ON-CHAIN INSTRUCTIONS REFERENCE
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-textDim">
                  Complete technical specification of all 9 Anchor smart contract instructions exposed by Program `j3bfzTbouGfN1dUAcD81BpuzRKXt1jjqxJ86rk4ZybA`.
                </p>
              </div>

              <div className="overflow-x-auto rounded border border-border bg-bg2">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-textFaint uppercase tracking-wider">
                      <th className="px-4 py-3">Instruction</th>
                      <th className="px-4 py-3">Signer</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Guards / Checks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono text-[11px]">
                    <tr>
                      <td className="px-4 py-3 text-cyan font-bold">create_market</td>
                      <td className="px-4 py-3 text-text">admin</td>
                      <td className="px-4 py-3 text-textDim">Initializes Market PDA, vault authority, and YES/NO SPL token mints.</td>
                      <td className="px-4 py-3 text-textDim">Valid resolution_time &gt; now</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-cyan font-bold">mint_shares</td>
                      <td className="px-4 py-3 text-text">user</td>
                      <td className="px-4 py-3 text-textDim">Deposits USDC collateral; mints equal amounts of YES and NO shares.</td>
                      <td className="px-4 py-3 text-textDim">!market.is_resolved</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-cyan font-bold">merge_shares</td>
                      <td className="px-4 py-3 text-text">user</td>
                      <td className="px-4 py-3 text-textDim">Burns equal amounts of YES + NO tokens to withdraw USDC back 1:1.</td>
                      <td className="px-4 py-3 text-textDim">amount &gt; 0, matching pairs</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-cyan font-bold">swap</td>
                      <td className="px-4 py-3 text-text">user</td>
                      <td className="px-4 py-3 text-textDim">Swaps YES for NO tokens or vice versa through CPMM AMM pool.</td>
                      <td className="px-4 py-3 text-textDim">!market.is_resolved, amount &gt; 0</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-cyan font-bold">add_liquidity</td>
                      <td className="px-4 py-3 text-text">lp_provider</td>
                      <td className="px-4 py-3 text-textDim">Adds YES and NO shares into pool reserves to enable swaps.</td>
                      <td className="px-4 py-3 text-textDim">!market.is_resolved</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-cyan font-bold">resolve_market</td>
                      <td className="px-4 py-3 text-text">oracle</td>
                      <td className="px-4 py-3 text-textDim">Declares winning outcome (1=YES, 2=NO, 3=VOID) and starts 48h timer.</td>
                      <td className="px-4 py-3 text-textDim">now &gt;= resolution_time, valid oracle</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-cyan font-bold">dispute_market</td>
                      <td className="px-4 py-3 text-text">disputer</td>
                      <td className="px-4 py-3 text-textDim">Challenges resolved outcome within 48h; freezes funds for review.</td>
                      <td className="px-4 py-3 text-textDim">is_resolved, now &lt; dispute_deadline</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-cyan font-bold">resolve_dispute</td>
                      <td className="px-4 py-3 text-text">admin</td>
                      <td className="px-4 py-3 text-textDim">Admin settles disputed market, sets final outcome, and unlocks redeem.</td>
                      <td className="px-4 py-3 text-textDim">is_disputed, admin signer</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-cyan font-bold">redeem</td>
                      <td className="px-4 py-3 text-text">user</td>
                      <td className="px-4 py-3 text-textDim">Burns winning outcome tokens to claim 1.00 USDC payout per share.</td>
                      <td className="px-4 py-3 text-textDim">is_resolved, !is_disputed, window closed</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* SECTION 5: USER & DEV GUIDE */}
          {activeSection === 'guide' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-wider text-text flex items-center gap-2">
                  <span className="text-cyan">05.</span> USER &amp; DEVELOPER GUIDE
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-textDim">
                  Step-by-step instructions for interacting with the platform in the browser or via Anchor SDK.
                </p>
              </div>

              {/* Devnet Setup Guide */}
              <div className="rounded border border-border bg-bg2 p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text">DEVNET WALLET SETUP</h3>
                <ol className="list-decimal list-inside text-xs text-textDim space-y-2 pl-2">
                  <li>Install a Solana wallet extension like <strong>Phantom</strong> or <strong>Solflare</strong>.</li>
                  <li>Switch your wallet network setting from <strong>Mainnet</strong> to <strong>Solana Devnet</strong>.</li>
                  <li>Request Devnet SOL for gas fees via <code className="text-cyan bg-bg px-1.5 py-0.5 rounded">solana airdrop 2</code> or <a href="https://faucet.solana.com" target="_blank" rel="noreferrer" className="text-cyan underline">faucet.solana.com</a>.</li>
                  <li>Devnet USDC Mint address used by Predix: <code className="text-green bg-bg px-1.5 py-0.5 rounded break-all">4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU</code>.</li>
                </ol>
              </div>

              {/* Code Snippet for SDK */}
              <div className="rounded border border-border bg-bg2 p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text">ANCHOR TYPESCRIPT CLIENT EXAMPLE</h3>
                <pre className="rounded bg-bg p-4 font-mono text-[11px] text-textDim overflow-x-auto leading-relaxed">
{`import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

// Initialize Anchor Provider
const provider = anchor.AnchorProvider.env();
const program = new anchor.Program(idl, provider);

// Fetch a market by address
const marketPubkey = new PublicKey("...");
const marketAccount = await program.account.market.fetch(marketPubkey);

console.log("Question:", marketAccount.question);
console.log("Is Resolved:", marketAccount.isResolved);
console.log("Winning Outcome:", marketAccount.winningOutcome);`}
                </pre>
              </div>
            </section>
          )}

          {/* SECTION 6: FAQ */}
          {activeSection === 'faq' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-wider text-text flex items-center gap-2">
                  <span className="text-cyan">06.</span> FREQUENTLY ASKED QUESTIONS
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-textDim">
                  Answers to common questions regarding trading, resolution, and security.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="rounded border border-border bg-bg2 p-4">
                  <div className="font-bold text-text uppercase tracking-wide">
                    Q: What happens if an event is cancelled or void?
                  </div>
                  <p className="mt-2 text-textDim leading-relaxed">
                    If an event cannot be resolved (cancelled match, ambiguous result), the oracle resolves with <strong>Outcome 3 (VOID)</strong>. Under Outcome 3, anyone holding either YES or NO shares can redeem them for a fair <strong>$0.50 USDC per share refund</strong>.
                  </p>
                </div>

                <div className="rounded border border-border bg-bg2 p-4">
                  <div className="font-bold text-text uppercase tracking-wide">
                    Q: Can I exit my position before the event deadline?
                  </div>
                  <p className="mt-2 text-textDim leading-relaxed">
                    Yes! You can either swap your shares for the opposite outcome on the AMM, or merge matching pairs (1 YES + 1 NO) to withdraw 1.00 USDC collateral directly back into your wallet.
                  </p>
                </div>

                <div className="rounded border border-border bg-bg2 p-4">
                  <div className="font-bold text-text uppercase tracking-wide">
                    Q: Can anyone dispute an outcome?
                  </div>
                  <p className="mt-2 text-textDim leading-relaxed">
                    Yes. Any connected Solana wallet can call `dispute_market()` during the 48-hour dispute challenge window. This freezes redemption payouts until the admin verifies real-world evidence and resolves the dispute.
                  </p>
                </div>

                <div className="rounded border border-border bg-bg2 p-4">
                  <div className="font-bold text-text uppercase tracking-wide">
                    Q: Where does trading liquidity come from?
                  </div>
                  <p className="mt-2 text-textDim leading-relaxed">
                    Liquidity is seeded at market creation and augmented by liquidity providers. The pool maintains a 0.30% fee on all swaps which stays in the reserve, increasing pool depth over time.
                  </p>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
