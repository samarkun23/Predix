use anchor_lang::prelude::*;
pub mod state;
pub mod instructions;

// imports 
pub use instructions::*;

declare_id!("DEqrLA39SpQF9C4UDgs9uoYjTSj362hHbwnJigFT4ebE");

#[program]
pub mod prediction_market_onchain {
    use super::*;

    pub fn create_market(
        ctx: Context<CreateMarket> ,
        market_id: u64,
        resolution_oracle: Pubkey,
        resolution_time: i64,
    ) -> Result<()>{
        instructions::create_market::create_market_handler(ctx, market_id, resolution_oracle, resolution_time)
    }
    
    pub fn mint_shares(
        ctx: Context<MintShares>,
        amount: u64,
    ) -> Result<()> {
        instructions::mint_shares::mint_shares_handler(ctx, amount)
    }
}

#[derive(Accounts)]
pub struct Initialize {}
