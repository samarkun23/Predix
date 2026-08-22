use anchor_lang::prelude::*;
pub mod state;

declare_id!("DEqrLA39SpQF9C4UDgs9uoYjTSj362hHbwnJigFT4ebE");

#[program]
pub mod prediction_market_onchain {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
