use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

pub use errors::*;
pub use instructions::*;

declare_id!("j3bfzTbouGfN1dUAcD81BpuzRKXt1jjqxJ86rk4ZybA");

#[program]
pub mod prediction_market_onchain {
    use super::*;

    pub fn create_market(
        ctx: Context<CreateMarket>,
        market_id: u64,
        resolution_oracle: Pubkey,
        resolution_time: i64,
        question: String,
        oracle_source: String,
    ) -> Result<()> {
        instructions::create_market_handler(
            ctx,
            market_id,
            resolution_oracle,
            resolution_time,
            question,
            oracle_source,
        )
    }

    pub fn mint_shares(ctx: Context<MintShares>, amount: u64) -> Result<()> {
        instructions::mint_shares_handler(ctx, amount)
    }

    pub fn merge_shares(ctx: Context<MergeShares>, amount: u64) -> Result<()> {
        instructions::merge_shares_handler(ctx, amount)
    }

    pub fn swap(ctx: Context<Swap>, amount_in: u64) -> Result<()> {
        instructions::swap_handler(ctx, amount_in)
    }

    pub fn add_liquidity(ctx: Context<AddLiquidity>, amount: u64) -> Result<()> {
        instructions::add_liquidity_handler(ctx, amount)
    }

    pub fn resolve_market(ctx: Context<ResolveMarket>, outcome: u8) -> Result<()> {
        instructions::resolve_market_handler(ctx, outcome)
    }

    pub fn dispute_market(ctx: Context<DisputeMarket>) -> Result<()> {
        instructions::dispute_market_handler(ctx)
    }

    pub fn resolve_dispute(ctx: Context<ResolveDispute>, outcome: u8) -> Result<()> {
        instructions::resolve_dispute_handler(ctx, outcome)
    }

    pub fn redeem(ctx: Context<Redeem>) -> Result<()> {
        instructions::redeem_handler(ctx)
    }
}
