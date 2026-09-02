use crate::state::Market;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    #[account(mut)]
    pub lp_provider: Signer<'info>, // user who will provide liquidity

    #[account(mut)]
    pub market: Account<'info, Market>, // market account

    #[account(
        address = market.outcome_yes_mint // this check is for checking check_mint pass by frontend this is same as check_mint that is inside the market acccount .
        // using this check no one pass fake yes tokens
    )]
    pub yes_mint: Box<Account<'info, Mint>>, // total supply and decimals

    #[account(
        address = market.outcome_no_mint
    )]
    pub no_mint: Box<Account<'info, Mint>>,

    // LP ke YES tokens (source)
    /// user ( lp_provider ) personal wallet where yes tokens are stored
    #[account(
        mut,
        associated_token::mint = yes_mint,
        associated_token::authority = lp_provider,
    )]
    pub lp_yes_ata: Box<Account<'info, TokenAccount>>,

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
        seeds=[b"vault", market.key().as_ref()],
        bump,
    )]
    pub vault_authority: UncheckedAccount<'info>,

    pub token_prgram: Program<'info, Token>,
}

pub fn handler(ctx: Context<AddLiquidity>, amount: u64) -> Result<()> {
    // tranasfer yes tokens from user account to vault yes account
    let transfer_yes_ctx = CpiContext::new(
        ctx.accounts.token_prgram.to_account_info(),
        Transfer {
            from: ctx.accounts.lp_yes_ata.to_account_info(),
            to: ctx.accounts.vault_yes_ata.to_account_info(),
            authority: ctx.accounts.lp_provider.to_account_info(),
        },
    );
    token::transfer(transfer_yes_ctx, amount);

    // tranasfer no tokens from user account to vault no account
    let transfer_no_ctx = CpiContext::new(
        ctx.accounts.token_prgram.to_account_info(),
        Transfer {
            from: ctx.accounts.lp_no_ata.to_account_info(),
            to: ctx.accounts.vault_no_ata.to_account_info(),
            authority: ctx.accounts.lp_provider.to_account_info(),
        },
    );
    token::transfer(transfer_no_ctx, amount);

    msg!(
        "Liquidity added {} yes and {} no token in the pool",
        amount,
        amount
    );
    Ok(())
}
