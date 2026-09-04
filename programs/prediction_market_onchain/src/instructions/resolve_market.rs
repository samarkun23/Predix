use crate::state::Market;
use anchor_lang::prelude::*;

#[error_code]
pub enum CustomError {
    #[msg("Market is already resolved")]
    InvalidOracle,
    #[msg("Market is already resolved")]
    MarketAlreadResolve,
    #[msg("Invalid Outcome")]
    InvalidOutcome,
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(mut)]
    pub market: Box<Account<'info, Market>>,

    #[account(
        constraint = oracle.key() == market.resolution_oracle @ CustomError::InvalidOracle
    )]
    pub oracle: Signer<'info>,
}

pub fn handler(ctx: Context<ResolveMarket>, outcome: u8) -> Result<()> {
    let market = &mut ctx.accounts.market;

    require!(!market.is_resolved, CustomError::MarketAlreadResolve);
    require!(outcome == 1 || outcome == 2, CustomError::InvalidOutcome);

    market.is_resolved = true;
    market.winning_outcome = outcome;

    // 48 hours = 172,800 sec
    market.dispute_deadline = Clock::get()?.unix_timestamp + 172800;
    market.is_disputed = false;
    market.disputed_count = 0;

    msg!("Market resolved! Winning outcome {}", outcome);
    Ok(())
}
