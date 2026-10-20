use crate::errors::MarketError;
use crate::state::Market;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct MergeShares<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        has_one = usdc_mint @ MarketError::InvalidMintMatch,
    )]
    pub market: Box<Account<'info, Market>>,

    pub usdc_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        address = market.outcome_yes_mint @ MarketError::InvalidMintMatch,
    )]
    pub yes_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        address = market.outcome_no_mint @ MarketError::InvalidMintMatch,
    )]
    pub no_mint: Box<Account<'info, Mint>>,

    // User's token accounts
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = user,
    )]
    pub user_usdc_ata: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = yes_mint,
        associated_token::authority = user,
    )]
    pub user_yes_ata: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = no_mint,
        associated_token::authority = user,
    )]
    pub user_no_ata: Box<Account<'info, TokenAccount>>,

    /// CHECK: Vault authority PDA for signing USDC transfer
    #[account(
        seeds = [b"vault", market.key().as_ref()],
        bump,
    )]
    pub vault_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = vault_authority,
    )]
    pub vault_usdc_ata: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
}

pub fn merge_shares_handler(ctx: Context<MergeShares>, amount: u64) -> Result<()> {
    require!(amount > 0, MarketError::ZeroAmount);

    let user = &ctx.accounts.user;
    let token_program = &ctx.accounts.token_program;

    // 1. Burn user's YES tokens
    let burn_yes_ctx = CpiContext::new(
        token_program.to_account_info(),
        Burn {
            mint: ctx.accounts.yes_mint.to_account_info(),
            from: ctx.accounts.user_yes_ata.to_account_info(),
            authority: user.to_account_info(),
        },
    );
    token::burn(burn_yes_ctx, amount)?;

    // 2. Burn user's NO tokens
    let burn_no_ctx = CpiContext::new(
        token_program.to_account_info(),
        Burn {
            mint: ctx.accounts.no_mint.to_account_info(),
            from: ctx.accounts.user_no_ata.to_account_info(),
            authority: user.to_account_info(),
        },
    );
    token::burn(burn_no_ctx, amount)?;

    // 3. Transfer USDC from vault back to user
    let market_key = ctx.accounts.market.key();
    let vault_seeds = &[
        b"vault",
        market_key.as_ref(),
        &[ctx.bumps.vault_authority],
    ];
    let signer = &[&vault_seeds[..]];

    let transfer_usdc_ctx = CpiContext::new_with_signer(
        token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.vault_usdc_ata.to_account_info(),
            to: ctx.accounts.user_usdc_ata.to_account_info(),
            authority: ctx.accounts.vault_authority.to_account_info(),
        },
        signer,
    );
    token::transfer(transfer_usdc_ctx, amount)?;

    msg!(
        "Successfully merged {} YES and {} NO shares for {} USDC",
        amount,
        amount,
        amount
    );

    Ok(())
}
