use crate::state::Market;
use anchor_lang::prelude::*;
use anchor_lang::Accounts;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub market: Box<Account<'info, Market>>,

    #[account(
        mut,
        address = market.outcome_yes_mint
    )]
    pub outcome_yes_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        address = market.outcome_no_mint
    )]
    pub outcome_no_mint: Box<Account<'info, Mint>>,

    // token which users gives
    #[account(mut)]
    pub user_source_ata: Box<Account<'info, TokenAccount>>,

    // token which users receives
    #[account(mut)]
    pub user_destination_ata: Box<Account<'info, TokenAccount>>,

    // vault source ATA
    #[account(
        mut,
        constraint = vault_source_ata.mint == user_source_ata.mint,
    )]
    pub vault_source_ata: Box<Account<'info, TokenAccount>>,

    // vault destination ATA
    #[account(
        mut,
        constraint = vault_destination_ata.mint == user_destination_ata.mint,
    )]
    pub vault_destination_ata: Box<Account<'info, TokenAccount>>,

    // check vault authorithy PDA
    /// CHECK: This PDA is only used as the signing authority for the vault token accounts.
    /// It is securely derived from the market's key and verified by the seeds constraint below.
    #[account(
        seeds=[b"vault", market.key().as_ref()],
        bump
    )]
    pub vault_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

#[error_code]
pub enum CustomError {
    #[msg("Market is already resolved")]
    MarketAlreadyResolved,
    #[msg("Insufficient liquidity in pool")]
    InsufficientLiquidity,
    #[msg("Calculated amount is too low")]
    AmountOutTooLow,
    #[msg("Math operation overflow")]
    MathOverflow,
}

pub fn handler(ctx: Context<Swap>, amount_in: u64) -> Result<()> {
    let market = &ctx.accounts.market;

    // check market resolve
    require!(!market.is_resolved, CustomError::MarketAlreadyResolved);

    // reserves (balance of inside of vault, not mint supply)
    let reserve_in = &ctx.accounts.vault_source_ata;
    let reserve_out = &ctx.accounts.vault_destination_ata;

    require!(
        reserve_in.amount > 0 && reserve_out.amount > 0,
        CustomError::InsufficientLiquidity
    );

    // AMM Math: constant product ( x * y = k ) with 0.3% fee so amount_in_with_fee = amount_in * 997 / 1000
    let amount_in_with_fee = amount_in
        .checked_mul(997)
        .ok_or(CustomError::MathOverflow)?
        .checked_div(1000)
        .ok_or(CustomError::MathOverflow)?;

    // amount_out = (reserve_out * amount_in_with_fee) / (reserve_in + amount_in_with_fee)

    let numerator = reserve_out
        .amount
        .checked_mul(amount_in_with_fee)
        .ok_or(CustomError::MathOverflow)?;

    let denominator = reserve_in
        .amount
        .checked_add(amount_in_with_fee)
        .ok_or(CustomError::MathOverflow)?;

    let amount_out = numerator
        .checked_div(denominator)
        .ok_or(CustomError::MathOverflow)?;

    require!(amount_out > 0, CustomError::AmountOutTooLow);

    // CPI : Transfer from user to vault
    let transfer_in_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.user_source_ata.to_account_info(),
            to: ctx.accounts.vault_source_ata.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        },
    );
    token::transfer(transfer_in_ctx, amount_in)?;

    // CPI : Transfer token from vault to user
    let market_key = ctx.accounts.market.key();
    let vault_bump = ctx.bumps.vault_authority;
    let vault_seeds = &[b"vault", market_key.as_ref(), &[vault_bump]];
    let signer = &[&vault_seeds[..]];
    let transfer_out_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.vault_destination_ata.to_account_info(),
            to: ctx.accounts.user_destination_ata.to_account_info(),
            authority: ctx.accounts.vault_authority.to_account_info(),
        },
        signer,
    );

    token::transfer(transfer_out_ctx, amount_out)?;

    msg!(
        "Swapped {} tokens for {} tokens (Fee: 0.3%)",
        amount_in,
        amount_out
    );

    Ok(())
}
