use crate::errors::MarketError;
use crate::state::Market;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(mut)]
    pub market: Box<Account<'info, Market>>,

    #[account(
        constraint = oracle.key() == market.resolution_oracle @ MarketError::InvalidOracle
    )]
    pub oracle: Signer<'info>,
}

pub fn resolve_market_handler(ctx: Context<ResolveMarket>, outcome: u8) -> Result<()> {
    let market = &mut ctx.accounts.market;

    require!(!market.is_resolved, MarketError::MarketAlreadyResolved);
    require!(
        Clock::get()?.unix_timestamp >= market.resolution_time,
        MarketError::ResolutionTimeNotReached
    );
    require!(
        outcome == 1 || outcome == 2 || outcome == 3,
        MarketError::InvalidOutcome
    );

    market.is_resolved = true;
    market.winning_outcome = outcome;

    // 48 hours dispute window = 172,800 sec
    market.dispute_deadline = Clock::get()?.unix_timestamp + 172800;
    market.is_disputed = false;
    market.disputed_count = 0;

    msg!(
        "Market {} resolved! Winning outcome: {}",
        market.market_id,
        outcome
    );
    Ok(())
}
