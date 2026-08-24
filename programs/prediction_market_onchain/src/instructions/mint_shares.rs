use crate::state::Market;
use anchor_lang::prelude::*;
use anchor_spl::token::{self,Mint,Token,TokenAccount, Transfer, MintTo};
use anchor_spl::associated_token::AssociatedToken;

#[derive(Accounts)]
pub struct MintShares<'info>{
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        has_one = usdc_mint,
    )]
    pub market: Box<Account<'info, Market>>,

    pub usdc_mint : Box<Account<'info, Mint>>,

    #[account(
        mut, 
        address = market.outcome_yes_mint,
    )]
    pub yes_mint: Box<Account<'info, Mint>>,

    #[account(
        mut, 
        address = market.outcome_no_mint,
    )]
    pub no_mint: Box<Account<'info, Mint>>,

    // User's token accounts ;
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = user,
    )]
    pub user_usdc_ata: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = yes_mint,
        associated_token::authority = user,
    )]
    pub user_yes_ata: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = no_mint,
        associated_token::authority = user,
    )]
    pub user_no_ata: Box<Account<'info, TokenAccount>>,

    // Vault PDA (Ye sirf ek authority ke taur par act karega)
    /// CHECK: This PDA is only used as the authority of the vault token account.
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
    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>
}

pub fn mint_shares_handler(ctx: Context<MintShares>, amount: u64) -> Result<()> {

        let market = &ctx.accounts.market;
        // 1. Transfer USDC from user to vault.
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_usdc_ata.to_account_info(),
                to: ctx.accounts.vault_usdc_ata.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, amount)?;

        // 2. Sign as a market pda by providing seeds bec pdas can't have private keys
        let market_seeds= &[
            b"market",
            market.admin.as_ref(),//TODO: need to check this.
            &market.market_id.to_le_bytes(),
            &[market.bump],
        ];
        let signer_seeds = &[&market_seeds[..]];

        // Mint yes tokens
        let mint_yes_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo{
                mint: ctx.accounts.yes_mint.to_account_info(),
                to: ctx.accounts.user_yes_ata.to_account_info(),
                authority: ctx.accounts.market.to_account_info()
            },

            signer_seeds
        );

        token::mint_to(mint_yes_ctx, amount)?;

        // mint no tokens 
        let mint_no_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo{
                mint: ctx.accounts.no_mint.to_account_info(),
                to: ctx.accounts.user_no_ata.to_account_info(),
                authority: ctx.accounts.market.to_account_info()
            },
            signer_seeds
        );

        token::mint_to(mint_no_ctx, amount)?;

        msg!(
            "Successfully minted {} YES and {} NO tokens for {} USDC",
            amount,
            amount,
            amount
        );

        Ok(())

    } 