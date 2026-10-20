use crate::errors::MarketError;
use crate::state::Market;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    #[account(mut)]
    pub lp_provider: Signer<'info>,

    #[account(mut)]
    pub market: Account<'info, Market>,

    #[account(
        address = market.outcome_yes_mint @ MarketError::InvalidMintMatch
    )]
    pub yes_mint: Box<Account<'info, Mint>>,

    #[account(
        address = market.outcome_no_mint @ MarketError::InvalidMintMatch
    )]
    pub no_mint: Box<Account<'info, Mint>>,

    // LP's YES tokens (source)
    #[account(
        mut,
        associated_token::mint = yes_mint,
        associated_token::authority = lp_provider,
    )]
    pub lp_yes_ata: Box<Account<'info, TokenAccount>>,

    // LP's NO tokens (source)
    #[account(
        mut,
        associated_token::mint = no_mint,
        associated_token::authority = lp_provider,
    )]
    pub lp_no_ata: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = yes_mint,
        associated_token::authority = vault_authority,
    )]
    pub vault_yes_ata: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = no_mint,
        associated_token::authority = vault_authority,
    )]
    pub vault_no_ata: Box<Account<'info, TokenAccount>>,

    /// CHECK: Vault authority PDA
    #[account(
        seeds = [b"vault", market.key().as_ref()],
        bump,
    )]
    pub vault_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn add_liquidity_handler(ctx: Context<AddLiquidity>, amount: u64) -> Result<()> {
    require!(!ctx.accounts.market.is_resolved, MarketError::MarketAlreadyResolved);
    require!(amount > 0, MarketError::ZeroAmount);

    // 1. Transfer YES tokens from LP to vault
    let transfer_yes_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.lp_yes_ata.to_account_info(),
            to: ctx.accounts.vault_yes_ata.to_account_info(),
            authority: ctx.accounts.lp_provider.to_account_info(),
        },
    );
    token::transfer(transfer_yes_ctx, amount)?;

    // 2. Transfer NO tokens from LP to vault
    let transfer_no_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.lp_no_ata.to_account_info(),
            to: ctx.accounts.vault_no_ata.to_account_info(),
            authority: ctx.accounts.lp_provider.to_account_info(),
        },
    );
    token::transfer(transfer_no_ctx, amount)?;

    msg!(
        "Liquidity added: {} YES and {} NO tokens in the pool",
        amount,
        amount
    );
    Ok(())
}
