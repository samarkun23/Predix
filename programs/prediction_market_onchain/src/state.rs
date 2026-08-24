use anchor_lang::prelude::*;

#[derive(InitSpace)]
#[account]
pub struct Market {
    pub market_id: u64,
    pub admin: Pubkey,
    pub usdc_mint: Pubkey,
    pub outcome_yes_mint: Pubkey, // SPL token mint for "yes" shares
    pub outcome_no_mint: Pubkey,  // SPL token mint for "no" shares
    pub vault_yes: Pubkey,        // pda holding yes liquidity
    pub vault_no: Pubkey,         // pda holding no liquidity
    pub resolution_oracle: Pubkey, // who can resolve this
    pub resolution_time: i64,
    pub is_resolved: bool,
    pub winning_outcome: u8, // 0 = None , 1 = Yes, 2 = No
    pub bump: u8,
}
