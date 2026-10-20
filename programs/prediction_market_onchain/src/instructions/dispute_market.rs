use crate::errors::MarketError;
use crate::state::Market;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct DisputeMarket<'info> {
    #[account(mut)]
    pub disputer: Signer<'info>,

    #[account(mut)]
    pub market: Box<Account<'info, Market>>,
}

pub fn dispute_market_handler(ctx: Context<DisputeMarket>) -> Result<()> {
    let market = &mut ctx.accounts.market;

    require!(market.is_resolved, MarketError::MarketNotResolved);
    require!(!market.is_disputed, MarketError::AlreadyDisputed);

    require!(
        Clock::get()?.unix_timestamp < market.dispute_deadline,
        MarketError::DisputeWindowClosed
    );

    market.is_disputed = true;
    market.disputed_count = market.disputed_count.saturating_add(1);

    msg!(
        "Market {} disputed by {}. Market frozen until dispute resolution.",
        market.market_id,
        ctx.accounts.disputer.key()
    );

    Ok(())
}
