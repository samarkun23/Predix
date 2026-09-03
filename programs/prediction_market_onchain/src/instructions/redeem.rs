use crate::state::Market;
use anchor_lang::prelude::*;
use anchor_spl::{associated_token::spl_associated_token_account::solana_program::message, token::{self, Burn, Mint, Token, TokenAccount, Transfer}};

#[error_code]
pub enum CustomError {
    #[msg("Market is no resolve yet")]
    MarketNotResolved,
    #[msg("Invalid winning token")]
    InvalidWinningOutcome,
    #[msg("No token to redeem")]
    NoTokenToRedeem,
    #[msg("Invalid mint match here")]
    InvaildMintMatch,
    #[msg("Invalid winning token")]
    InvalidWinningToken
}

#[derive(Accounts)]
pub struct Redeem<'info>{
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        constraint = market.is_resolved @ CustomError::MarketNotResolved
    )]
    pub market: Box<Account<'info,Market>>,

    // user winning token account
    #[account(
        mut, 
        constraint = user_winning_ata.owner == user.key(),
        constraint = (market.winning_outcome == 1 && user_winning_ata.mint == market.outcome_yes_mint) ||
                    (market.winning_outcome == 2 && user_winning_ata.mint == market.outcome_no_mint) 
                    @ CustomError::InvalidWinningOutcome,
        constraint = user_winning_ata.mint == market.outcome_yes_mint || user_winning_ata.mint == market.outcome_no_mint,
    )]
    pub user_winning_ata: Box<Account<'info,TokenAccount>>,

    // this is the mint account we are creating bec burn cpi need a mint account not token account 
    #[account(
        mut,
        constraint = winning_mint.key() == user_winning_ata.mint @ CustomError::InvaildMintMatch
    )]
    pub winning_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        associated_token::mint = market.usdc_mint,
        associated_token::authority = user,
    )]
    pub user_usdc_ata: Box<Account<'info,TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = market.usdc_mint,
        associated_token::authority = vault_authority,
    )]
    pub vault_usdc_ata: Box<Account<'info,TokenAccount>>,

    /// CHECK: This PDA is only used as the signing authority for the vault token accounts.
    #[account(
        seeds = [b"vault",market.key().as_ref()],
        bump,
    )]
    pub vault_authority:  UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Redeem>) -> Result<()> {
    let market = &ctx.accounts.market;
    let amount_to_redeem = ctx.accounts.user_winning_ata.amount;

    require!(amount_to_redeem > 0, CustomError::NoTokenToRedeem); 

    let is_yes_winner = market.winning_outcome == 1 && ctx.accounts.user_winning_ata.mint == market.outcome_yes_mint;
    let is_no_winner = market.winning_outcome == 2 && ctx.accounts.user_winning_ata.mint == market.outcome_no_mint;
    
    require!(is_yes_winner || is_no_winner, CustomError::InvalidWinningToken);

    // buring winning tokens
    let burn_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(), 
        Burn{
            mint: ctx.accounts.winning_mint.to_account_info(),
            from: ctx.accounts.user_winning_ata.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        },
    );
    token::burn(burn_ctx, amount_to_redeem)?;

    // Transfer usdc from vault to user 
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
        signer
    );
    token::transfer(transfer_ctx, amount_to_redeem)?;

    msg!("Successfully redeemed {} USDC", amount_to_redeem);

    Ok(())
}
