use crate::errors::MarketError;
use crate::state::Market;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct Redeem<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        constraint = market.is_resolved @ MarketError::MarketNotResolved
    )]
    pub market: Box<Account<'info, Market>>,

    // User's winning (or refund) token account
    #[account(
        mut,
        constraint = user_winning_ata.owner == user.key(),
        constraint = (
            (market.winning_outcome == 1 && user_winning_ata.mint == market.outcome_yes_mint) ||
            (market.winning_outcome == 2 && user_winning_ata.mint == market.outcome_no_mint) ||
            (market.winning_outcome == 3 && (user_winning_ata.mint == market.outcome_yes_mint || user_winning_ata.mint == market.outcome_no_mint))
        ) @ MarketError::InvalidWinningToken,
    )]
    pub user_winning_ata: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = winning_mint.key() == user_winning_ata.mint @ MarketError::InvalidMintMatch
    )]
    pub winning_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        associated_token::mint = market.usdc_mint,
        associated_token::authority = user,
    )]
    pub user_usdc_ata: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = market.usdc_mint,
        associated_token::authority = vault_authority,
    )]
    pub vault_usdc_ata: Box<Account<'info, TokenAccount>>,

    /// CHECK: This PDA is only used as the signing authority for the vault token accounts.
    #[account(
        seeds = [b"vault", market.key().as_ref()],
        bump,
    )]
    pub vault_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn redeem_handler(ctx: Context<Redeem>) -> Result<()> {
    let market = &ctx.accounts.market;
    let amount_to_redeem = ctx.accounts.user_winning_ata.amount;

    require!(
        Clock::get()?.unix_timestamp > market.dispute_deadline,
        MarketError::DisputeWindowOpen
    );
    require!(!market.is_disputed, MarketError::MarketDisputed);
    require!(amount_to_redeem > 0, MarketError::ZeroAmount);

    // Calculate payout
    // Outcomes: 1 = YES (1:1), 2 = NO (1:1), 3 = INVALID / REFUND (0.50 USDC per share)
    let payout_amount = if market.winning_outcome == 3 {
        amount_to_redeem
            .checked_div(2)
            .ok_or(MarketError::MathOverflow)?
    } else {
        amount_to_redeem
    };

    require!(payout_amount > 0, MarketError::ZeroAmount);

    // 1. Burn user's winning/refund tokens
    let burn_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Burn {
            mint: ctx.accounts.winning_mint.to_account_info(),
            from: ctx.accounts.user_winning_ata.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        },
    );
    token::burn(burn_ctx, amount_to_redeem)?;

    // 2. Transfer USDC payout from vault to user
    let market_key = market.key();
    let vault_seeds = &[
        b"vault",
        market_key.as_ref(),
        &[ctx.bumps.vault_authority],
    ];
    let signer = &[&vault_seeds[..]];

    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.vault_usdc_ata.to_account_info(),
            to: ctx.accounts.user_usdc_ata.to_account_info(),
            authority: ctx.accounts.vault_authority.to_account_info(),
        },
        signer,
    );
    token::transfer(transfer_ctx, payout_amount)?;

    msg!(
        "Successfully redeemed {} shares for {} USDC (Outcome: {})",
        amount_to_redeem,
        payout_amount,
        market.winning_outcome
    );

    Ok(())
}
