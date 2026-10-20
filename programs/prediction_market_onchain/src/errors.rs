use anchor_lang::prelude::*;

#[error_code]
pub enum MarketError {
    #[msg("Market is already resolved")]
    MarketAlreadyResolved,

    #[msg("Market is not resolved yet")]
    MarketNotResolved,

    #[msg("Resolution time has not been reached yet")]
    ResolutionTimeNotReached,

    #[msg("Unauthorized oracle")]
    InvalidOracle,

    #[msg("Unauthorized admin")]
    UnauthorizedAdmin,

    #[msg("Invalid winning outcome (must be 1 for YES, 2 for NO, or 3 for INVALID)")]
    InvalidOutcome,

    #[msg("Dispute window is closed")]
    DisputeWindowClosed,

    #[msg("Dispute window is still open, please wait")]
    DisputeWindowOpen,

    #[msg("Market is already disputed")]
    AlreadyDisputed,

    #[msg("Market is not currently disputed")]
    MarketNotDisputed,

    #[msg("Market is disputed, funds are frozen until dispute resolution")]
    MarketDisputed,

    #[msg("No tokens available to redeem or merge")]
    ZeroAmount,

    #[msg("Token mint does not match market specification")]
    InvalidMintMatch,

    #[msg("Token account does not hold the winning outcome token")]
    InvalidWinningToken,

    #[msg("Insufficient liquidity in the AMM pool")]
    InsufficientLiquidity,

    #[msg("Calculated swap output is too low")]
    AmountOutTooLow,

    #[msg("Math operation overflow")]
    MathOverflow,
}
