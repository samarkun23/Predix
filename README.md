# 🔮 Predix — Decentralized Prediction Markets on Solana

> **Trade on the future. Powered by Solana. Governed by math.**

Predix is a fully on-chain prediction market protocol built on Solana using the Anchor framework. Users create markets around real-world events, buy YES/NO outcome shares, and earn USDC when they're right. All pricing is handled by an automated market maker (AMM) — no order books, no counterparty risk.

---

## 🌐 Live Demo

| | |
|---|---|
| **Frontend** | [https://predix-git-main-samarkuns-projects.vercel.app/](https://predix-git-main-samarkuns-projects.vercel.app/) *(update with your Vercel URL)* |
| **Network** | Solana **Devnet** |
| **Program ID** | `j3bfzTbouGfN1dUAcD81BpuzRKXt1jjqxJ86rk4ZybA` |

> ⚠️ This project is deployed on **Devnet**. Set your wallet (Phantom / Solflare / Backpack) to **Devnet** before interacting.

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Blockchain** | Solana (Devnet) |
| **Smart Contract** | Anchor 0.32.1, Rust |
| **Frontend** | Next.js 14 (App Router), React 18 |
| **Styling** | Tailwind CSS 3.4 |
| **Language** | TypeScript 5 |
| **Wallet** | Solana Wallet Standard (`@solana/wallet-adapter-react`) |
| **AMM Client** | `@coral-xyz/anchor` ^0.32.1, `@solana/web3.js` ^1.98 |
| **Storage** | On-chain (Solana PDAs), LocalStorage (trade history) |

---

## ✨ Features

### 🏗️ Smart Contract (Anchor)
- **9 on-chain instructions**: create market, add liquidity, mint shares, swap, merge shares, resolve, dispute, resolve dispute, redeem
- **Constant-Product AMM** (`x * y = k`) for automatic YES/NO pricing
- **5-phase market lifecycle**: Active → Expired → Resolved / Disputed → Redeemable
- **Outcome 3 (VOID)**: markets can be refunded if oracle data is unavailable
- **Merge Shares**: burn 1 YES + 1 NO share to redeem 1 USDC before resolution
- **Dispute & Override**: users can dispute markets; admin can resolve disputes

### 📊 Frontend (Next.js)
- **Public market discovery** — no wallet needed to browse markets
- **Interactive price chart** — SVG crosshairs, 1H/1D/1W/ALL timeframes, floating tooltip
- **1-Click Buy** — bundles `mintShares + swap` into a single transaction
- **Portfolio page** — scans all on-chain token accounts + localStorage trade history
- **Docs page** — in-app documentation covering AMM math, lifecycle, all 9 instructions
- **Oracle panel** — oracle-wallet-aware resolution UI for market creators
- **Dispute banner** — live 48-hour countdown with one-click dispute action
- **Redeem panel** — claim winnings after resolution with one click

---

## 🏛️ Architecture

### Program Accounts (PDAs)

```
Market PDA     → seeds: ["market", market_id]
Pool PDA       → seeds: ["pool", market_pubkey]
Vault PDA      → seeds: ["vault", market_pubkey]
YES Mint PDA   → seeds: ["yes_mint", market_pubkey]
NO Mint PDA    → seeds: ["no_mint", market_pubkey]
```

### AMM Pricing (CPMM)

```
Price(YES) = noReserve / (yesReserve + noReserve) × 100
Price(NO)  = yesReserve / (yesReserve + noReserve) × 100

Swap formula:  amountOut = (reserveOut × amountIn) / (reserveIn + amountIn)
```

YES + NO prices always sum to **100 cents** (1 USDC).

### Key Addresses

| | Address |
|---|---|
| **Program ID** | `j3bfzTbouGfN1dUAcD81BpuzRKXt1jjqxJ86rk4ZybA` |
| **Devnet USDC Mint** | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` |

---

## 📋 Smart Contract Instructions

| # | Instruction | Description |
|---|---|---|
| 1 | `create_market` | Initialize a new prediction market with metadata and oracle |
| 2 | `add_liquidity` | Seed the AMM pool with initial YES/NO liquidity |
| 3 | `mint_shares` | Deposit USDC to mint equal YES + NO shares |
| 4 | `swap` | Swap YES ↔ NO shares via CPMM (adjust your position) |
| 5 | `merge_shares` | Burn 1 YES + 1 NO → redeem 1 USDC (before resolution) |
| 6 | `resolve_market` | Oracle resolves market: Outcome 1 (YES), 2 (NO), or 3 (VOID) |
| 7 | `dispute_market` | User raises a dispute on a resolved market |
| 8 | `resolve_dispute` | Admin overrides a disputed resolution |
| 9 | `redeem` | Claim USDC winnings for winning shares after resolution |

---

## 🔄 Market Lifecycle

```
         CREATE MARKET
               │
               ▼
         ┌──────────┐
         │  ACTIVE  │  ← Users buy/sell YES & NO shares
         └──────────┘
               │  (after resolution_time)
               ▼
         ┌──────────┐
         │ EXPIRED  │  ← Awaiting oracle resolution
         └──────────┘
          /         \
    RESOLVED        DISPUTED (48h window)
      │                    │
      │            RESOLVE DISPUTE (admin)
      │                    │
      └────────────┬────────┘
                   ▼
            ┌──────────────┐
            │  REDEEMABLE  │  ← Winners claim USDC
            └──────────────┘
```

**Outcome codes:**
- `1` → YES wins (YES holders claim full USDC value)
- `2` → NO wins (NO holders claim full USDC value)
- `3` → VOID (all holders get proportional USDC refund)

---

## 🖼️ Screenshots

> **Replace the placeholders below with your actual screenshots.**
> Place your screenshots in a `screenshots/` folder at the project root.

### Home — Market Discovery
![Home page showing all prediction markets](./screenshots/home.png)

### Market Detail — Trading & Price Chart
![Market detail page with AMM chart and trading panel](./screenshots/market-detail.png)

### Create Market
![Create market form with live preview](./screenshots/create-market.png)

### Portfolio
![Portfolio page showing positions and P&L](./screenshots/portfolio.png)

### Documentation
![In-app documentation page](./screenshots/docs.png)

### Oracle Resolution Panel *(oracle wallet only)*
![Oracle resolution UI for resolving expired markets](./screenshots/resolve-panel.png)

### Dispute Banner
![48-hour countdown dispute banner on a resolved market](./screenshots/dispute-banner.png)

### Redeem Panel
![Claim winnings panel after market resolution](./screenshots/redeem-panel.png)

---

## 🛠️ Local Development

### Prerequisites

- [Rust](https://rustup.rs/) (stable)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) `>= 1.18`
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) `0.32.1`
- [Node.js](https://nodejs.org/) `>= 18`
- npm or Yarn

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/prediction_market_onchain.git
cd prediction_market_onchain
```

### 2. Build the Anchor program

```bash
anchor build
```

> The compiled IDL and program binary will be in `target/idl/` and `target/deploy/`.

### 3. Deploy to Devnet

```bash
# Point Solana CLI to Devnet
solana config set --url devnet

# Airdrop SOL if needed
solana airdrop 2

# Deploy
anchor deploy
```

After deploying, copy the new **Program ID** and update:
- `Anchor.toml` → `[programs.devnet]`
- `Predix/idl/prediction_market_onchain.json` → `"metadata.address"`
- `Predix/lib/anchor.ts` → `PROGRAM_ID`

### 4. Run the frontend

```bash
cd Predix
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Build for production

```bash
cd Predix
npm run build
npm start
```

---

## 🌍 Vercel Deployment

1. Push your repository to GitHub.
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo.
3. Set **Root Directory** to `Predix`.
4. Framework: **Next.js** (auto-detected).
5. No environment variables are required — all addresses are hardcoded.
6. Click **Deploy**.

> Users must set their wallet to **Devnet** in wallet settings to interact with the app.

---

## 📂 Project Structure

```
prediction_market_onchain/
├── programs/
│   └── prediction_market_onchain/
│       └── src/
│           ├── lib.rs                  # Program entrypoint, all 9 instructions
│           ├── errors.rs               # Centralized MarketError enum
│           ├── state.rs                # Market & Pool account structs
│           └── instructions/
│               ├── create_market.rs
│               ├── add_liquidity.rs
│               ├── mint_shares.rs
│               ├── swap.rs
│               ├── merge_shares.rs     # Burn YES+NO → USDC
│               ├── resolve_market.rs
│               ├── dispute_market.rs
│               ├── resolve_dispute.rs  # Admin override
│               └── redeem.rs
├── Predix/                             # Next.js frontend
│   ├── app/
│   │   ├── page.tsx                    # Home — market discovery
│   │   ├── markets/[id]/page.tsx       # Market detail
│   │   ├── create/page.tsx             # Create market
│   │   ├── portfolio/page.tsx          # User portfolio
│   │   └── docs/page.tsx               # Documentation
│   ├── components/
│   │   ├── market-detail/
│   │   │   ├── PriceChart.tsx          # Interactive SVG chart
│   │   │   ├── SwapPanel.tsx           # 3-mode trading panel
│   │   │   ├── ResolveMarketPanel.tsx  # Oracle resolution UI
│   │   │   ├── DisputeBanner.tsx       # 48h dispute countdown
│   │   │   └── RedeemPanel.tsx         # Claim winnings
│   │   ├── create-market/
│   │   │   ├── CreateMarketForm.tsx
│   │   │   └── FormSummaryPanel.tsx
│   │   ├── portfolio/
│   │   │   ├── PositionsTable.tsx
│   │   │   └── PositionCardMobile.tsx
│   │   ├── providers/
│   │   │   └── WalletProvider.tsx      # Solana Wallet Standard
│   │   └── layout/
│   │       ├── Navbar.tsx
│   │       └── Footer.tsx
│   ├── lib/
│   │   ├── anchor.ts                   # Program connection helpers
│   │   ├── data.ts                     # Market data & price history
│   │   ├── types.ts                    # Shared TypeScript types
│   │   ├── portfolio.ts                # Portfolio utilities
│   │   └── portfolioStorage.ts         # localStorage trade persistence
│   └── idl/
│       └── prediction_market_onchain.json
├── Anchor.toml
└── README.md
```

---

## 🔐 Security Notes

- **Oracle trust**: Currently the market creator's wallet acts as the oracle. In production, integrate Pyth or Switchboard for trustless price feeds.
- **Dispute window**: Resolved markets have a 48-hour window for disputes before winnings can be claimed.
- **Admin key**: The `resolve_dispute` instruction requires the admin keypair stored in `Anchor.toml`. Rotate this for mainnet.
- **Devnet only**: This project is for demonstration/testing purposes on Devnet. Do not use on Mainnet-Beta without a full security audit.

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

```bash
# Run Rust lints
cargo clippy --all-targets

# Check TypeScript
cd Predix && npx tsc --noEmit

# Build frontend
cd Predix && npm run build
```

---

## 📸 Screenshots Checklist

Create a `screenshots/` folder and add these images:

| Filename | What to Capture |
|---|---|
| `home.png` | Home page with market cards listed |
| `market-detail.png` | Market detail — chart + swap panel visible |
| `create-market.png` | Create market form with preview panel filled in |
| `portfolio.png` | Portfolio page with at least one position shown |
| `docs.png` | Documentation page (any section open) |
| `resolve-panel.png` | Oracle resolution panel (connect oracle wallet to see it) |
| `dispute-banner.png` | Dispute banner on a just-resolved market |
| `redeem-panel.png` | Redeem panel with a winning position after resolution |

> **Tip:** For `resolve-panel.png`, connect with the wallet that **created** the market. For `redeem-panel.png`, use a wallet holding winning shares.

---

## 📄 License

MIT © 2025 Predix Contributors
