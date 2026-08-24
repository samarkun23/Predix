import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PredictionMarketOnchain } from "../target/types/prediction_market_onchain";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert } from "chai";

describe("prediction_market_onchain", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // FIX 1: Correct workspace program name
  const program = anchor.workspace.PredictionMarketOnchain as Program<PredictionMarketOnchain>;
  const admin = provider.wallet;

  let usdcMint: anchor.web3.PublicKey;
  let marketId = new anchor.BN(1);
  let marketPda: anchor.web3.PublicKey;
  let marketBump: number;

  let outcomeYesMint: anchor.web3.Keypair;
  let outcomeNoMint: anchor.web3.Keypair;

  before(async () => {
    usdcMint = await createMint(
      provider.connection,
      admin.payer,
      admin.publicKey,
      admin.publicKey,
      6
    );
    console.log("✅ Mock USDC Mint created:", usdcMint.toBase58());

    outcomeYesMint = anchor.web3.Keypair.generate();
    outcomeNoMint = anchor.web3.Keypair.generate();
  });

  it("Creates a new market successfully", async () => {
    [marketPda, marketBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("market"),
        admin.publicKey.toBuffer(),
        marketId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const [vaultAuthority, vaultAuthorityBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), marketPda.toBuffer()],
      program.programId
    );

    const vaultUsdcAta = getAssociatedTokenAddressSync(usdcMint, vaultAuthority, true);
    const vaultYesAta = getAssociatedTokenAddressSync(outcomeYesMint.publicKey, vaultAuthority, true);
    const vaultNoAta = getAssociatedTokenAddressSync(outcomeNoMint.publicKey, vaultAuthority, true);

    const resolutionTime = new anchor.BN(Math.floor(Date.now() / 1000) + 86400);

    await program.methods
      .createMarket(marketId, admin.publicKey, resolutionTime)
      .accountsPartial({
        admin: admin.publicKey,
        market: marketPda,
        usdcMint: usdcMint,
        outcomeYesMint: outcomeYesMint.publicKey,
        outcomeNoMint: outcomeNoMint.publicKey,
        vaultAuthority: vaultAuthority,
        vaultUsdcAta: vaultUsdcAta,
        vaultYesAta: vaultYesAta,
        vaultNoAta: vaultNoAta,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([outcomeYesMint, outcomeNoMint])
      .rpc();

    const marketAccount = await program.account.market.fetch(marketPda);
    assert.equal(marketAccount.marketId.toNumber(), 1);
    assert.equal(marketAccount.admin.toBase58(), admin.publicKey.toBase58());
    console.log("✅ Market created successfully!");
  });

  it("Mints YES and NO shares for USDC", async () => {
    const amountToMint = new anchor.BN(100_000_000); // 100 USDC (6 decimals)

    const userUsdcAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      admin.payer,
      usdcMint,
      admin.publicKey
    );
    
    await mintTo(
      provider.connection,
      admin.payer,
      usdcMint,
      userUsdcAta.address,
      admin.publicKey,
      amountToMint.toNumber()
    );

    const marketAccount = await program.account.market.fetch(marketPda);

    // FIX 2: Re-derive vaultAuthority PDA for this instruction
    const [testVaultAuthority] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), marketPda.toBuffer()],
      program.programId
    );

    await program.methods
      .mintShares(amountToMint)
      .accountsPartial({
        user: admin.publicKey,
        market: marketPda,
        usdcMint: usdcMint,
        yesMint: marketAccount.outcomeYesMint,
        noMint: marketAccount.outcomeNoMint,
        userUsdcAta: userUsdcAta.address,
        userYesAta: getAssociatedTokenAddressSync(marketAccount.outcomeYesMint, admin.publicKey),
        userNoAta: getAssociatedTokenAddressSync(marketAccount.outcomeNoMint, admin.publicKey),
        vaultAuthority: testVaultAuthority, // FIX 3: Use derived PDA, NOT marketAccount.vaultYes
        vaultUsdcAta: getAssociatedTokenAddressSync(usdcMint, testVaultAuthority, true),
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const userUsdcBalance = await getAccount(provider.connection, userUsdcAta.address);
    assert.equal(Number(userUsdcBalance.amount), 0); // USDC deposited

    const userYesAta = getAssociatedTokenAddressSync(marketAccount.outcomeYesMint, admin.publicKey);
    const userYesBalance = await getAccount(provider.connection, userYesAta);
    assert.equal(Number(userYesBalance.amount), amountToMint.toNumber()); // Got YES

    const userNoAta = getAssociatedTokenAddressSync(marketAccount.outcomeNoMint, admin.publicKey);
    const userNoBalance = await getAccount(provider.connection, userNoAta);
    assert.equal(Number(userNoBalance.amount), amountToMint.toNumber()); // Got NO

    console.log("✅ Successfully minted YES and NO shares!");
  });
});