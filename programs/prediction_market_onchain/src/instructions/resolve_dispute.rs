use crate::errors::MarketError;
use crate::state::Market;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(
        constraint = admin.key() == market.admin @ MarketError::UnauthorizedAdmin
    )]
    pub admin: Signer<'info>,

    #[account(mut)]
    pub market: Box<Account<'info, Market>>,
}

pub fn resolve_dispute_handler(ctx: Context<ResolveDispute>, outcome: u8) -> Result<()> {
    let market = &mut ctx.accounts.market;

    require!(market.is_resolved, MarketError::MarketNotResolved);
    require!(market.is_disputed, MarketError::MarketNotDisputed);
    require!(
        outcome == 1 || outcome == 2 || outcome == 3,
        MarketError::InvalidOutcome
    );

    market.is_disputed = false;
    market.winning_outcome = outcome;
    market.dispute_deadline = Clock::get()?.unix_timestamp;

    msg!(
        "Dispute on market {} resolved by admin {}. Final winning outcome: {}",
        market.market_id,
        ctx.accounts.admin.key(),
        outcome
    );

    Ok(())
}
