use anchor_lang::prelude::*;
pub mod instructions;
pub mod state;

// imports
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
    ) -> Result<()> {
        instructions::create_market::create_market_handler(
            ctx,
            market_id,
            resolution_oracle,
            resolution_time,
        )
    }

    pub fn mint_shares(ctx: Context<MintShares>, amount: u64) -> Result<()> {
        instructions::mint_shares::mint_shares_handler(ctx, amount)
    }

    pub fn swap(ctx: Context<Swap>, amount_in: u64) -> Result<()> {
        instructions::swap::handler(ctx, amount_in)
    }

    pub fn add_liquidity(ctx: Context<AddLiquidity>, amount: u64) -> Result<()> {
        instructions::add_liquidity::handler(ctx, amount)
    }

    pub fn resolve_market(ctx: Context<ResolveMarket>, outcome: u8) -> Result<()> {
        instructions::resolve_market::handler(ctx, outcome)
    }

    pub fn redeem(ctx: Context<Redeem>) -> Result<()> {
        instructions::redeem::handler(ctx)
    }
}

#[derive(Accounts)]
pub struct Initialize {}
