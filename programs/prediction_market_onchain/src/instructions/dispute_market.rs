use crate::state::Market;
use anchor_lang::prelude::*;

#[error_code]
pub enum CustomError {
    // ... purane errors ...
    #[msg("Market is not resolved yet")]
    MarketNotResolved,
    #[msg("Dispute window is closed")]
    DisputeWindowClosed,
    #[msg("Market is already disputed")]
    AlreadyDisputed,
    #[msg("Dispute window is still open, please wait")]
    DisputeWindowOpen,
    #[msg("Market is disputed, funds frozen for V2 governance")]
    MarketDisputed,
}

#[derive(Accounts)]
pub struct DisputeMarket<'info> {
    #[account(mut)]
    pub disputer: Signer<'info>,

    #[account(mut)]
    pub market: Box<Account<'info, Market>>,
}

pub fn handler(ctx: Context<DisputeMarket>) -> Result<()> {
    let market = &mut ctx.accounts.market;

    require!(market.is_resolved, CustomError::MarketNotResolved);
    require!(!market.is_disputed, CustomError::AlreadyDisputed);

    require!(
        Clock::get()?.unix_timestamp < market.dispute_deadline,
        CustomError::DisputeWindowClosed
    );

    market.is_disputed = true;
    market.disputed_count += 1;

    msg!(
        "Market {} disputed by {} . Pool forzen for v2 governance.",
        market.market_id,
        ctx.accounts.disputer.key()
    );

    Ok(())
}
