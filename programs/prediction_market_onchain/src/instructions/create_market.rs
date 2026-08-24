use crate::state::Market;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount}
};


#[derive(Accounts)]
#[instruction(market_id:u64)]
pub struct CreateMarket<'info>{
    #[account(mut)]
    pub admin: Signer<'info>,

    // market pda init
    #[account(
        init,
        payer=admin,
        space = 8 + Market::INIT_SPACE,
        seeds = [
            b"market",
            admin.key().as_ref(),
            market_id.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub market: Account<'info, Market>,

    pub usdc_mint: Account<'info, Mint>,

    // Yes mint account init 
    #[account(
        init,
        payer = admin,
        mint::decimals = 6,
        mint::authority = market
    )]
    pub outcome_yes_mint: Account<'info, Mint>,

    // No mint account init
    #[account(
        init,
        payer = admin,
        mint::decimals = 6,
        mint::authority = market
    )]
    pub outcome_no_mint: Account<'info, Mint>,

    // Vault authority PDA (sign the vault trx)
    #[account( // we don't init this account bec we don't need to store anything in it we just need to sign the trx
        seeds = [b"vault", market.key().as_ref()],
        bump
    )]
    /// CHECK: This is a PDA used solely for signing CPIs, it holds no data.
    pub vault_authority: UncheckedAccount<'info>,

    // Vault usdc , yes and no init 
    #[account(
        init,
        payer = admin,
        associated_token::mint = usdc_mint,
        associated_token::authority = vault_authority
    )]
    pub vault_usdc_ata: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = admin,
        associated_token::mint = outcome_yes_mint,
        associated_token::authority = vault_authority
    )]
    pub vault_yes_ata: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = admin,
        associated_token::mint = outcome_no_mint,
        associated_token::authority = vault_authority
    )]
    pub vault_no_ata: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>
}

pub fn create_market_handler(
    ctx: Context<CreateMarket>,
    market_id: u64,
    resolution_oracle: Pubkey,
    resolution_time: i64,
) -> Result<()>{
    let market = &mut ctx.accounts.market;

    market.market_id = market_id;
    market.admin = ctx.accounts.admin.key();
    market.usdc_mint = ctx.accounts.usdc_mint.key();
    market.outcome_yes_mint = ctx.accounts.outcome_yes_mint.key();
    market.outcome_no_mint = ctx.accounts.outcome_no_mint.key();
    market.vault_yes = ctx.accounts.vault_yes_ata.key();
    market.vault_no = ctx.accounts.vault_no_ata.key();
    market.resolution_oracle = resolution_oracle;
    market.resolution_time = resolution_time;
    market.is_resolved = false;
    market.winning_outcome = 0; // 0 = None
    market.bump = ctx.bumps.market;

    msg!("Market created Successfully with ID {}", market_id);
    Ok(())
}