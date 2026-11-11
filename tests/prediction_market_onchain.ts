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

    const program = anchor.workspace.PredictionMarketOnchain as Program<PredictionMarketOnchain>;
    const admin = provider.wallet;

    let usdcMint: anchor.web3.PublicKey;
    let marketId = new anchor.BN(1);
    let marketPda: anchor.web3.PublicKey;
    let marketBump: number;

    let outcomeYesMint: anchor.web3.Keypair;
    let outcomeNoMint: anchor.web3.Keypair;

    let vaultAuthority: anchor.web3.PublicKey;
    let vaultAuthorityBump: number;

    // Past resolution time market for resolution tests
    let expiredMarketId = new anchor.BN(2);
    let expiredMarketPda: anchor.web3.PublicKey;
    let expiredYesMint: anchor.web3.Keypair;
    let expiredNoMint: anchor.web3.Keypair;
    let expiredVaultAuthority: anchor.web3.PublicKey;

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

        expiredYesMint = anchor.web3.Keypair.generate();
        expiredNoMint = anchor.web3.Keypair.generate();
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

        [vaultAuthority, vaultAuthorityBump] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("vault"), marketPda.toBuffer()],
            program.programId
        );

        const vaultUsdcAta = getAssociatedTokenAddressSync(usdcMint, vaultAuthority, true);
        const vaultYesAta = getAssociatedTokenAddressSync(outcomeYesMint.publicKey, vaultAuthority, true);
        const vaultNoAta = getAssociatedTokenAddressSync(outcomeNoMint.publicKey, vaultAuthority, true);

        // Future resolution time (+24h)
        const resolutionTime = new anchor.BN(Math.floor(Date.now() / 1000) + 86400);

        await program.methods
            .createMarket(marketId, admin.publicKey, resolutionTime, "Will Bitcoin reach $100k by Dec 2026?", "https://coingecko.com")
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
                vaultAuthority: vaultAuthority,
                vaultUsdcAta: getAssociatedTokenAddressSync(usdcMint, vaultAuthority, true),
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();

        const userUsdcBalance = await getAccount(provider.connection, userUsdcAta.address);
        assert.equal(Number(userUsdcBalance.amount), 0);

        const userYesAta = getAssociatedTokenAddressSync(marketAccount.outcomeYesMint, admin.publicKey);
        const userYesBalance = await getAccount(provider.connection, userYesAta);
        assert.equal(Number(userYesBalance.amount), amountToMint.toNumber());

        const userNoAta = getAssociatedTokenAddressSync(marketAccount.outcomeNoMint, admin.publicKey);
        const userNoBalance = await getAccount(provider.connection, userNoAta);
        assert.equal(Number(userNoBalance.amount), amountToMint.toNumber());

        console.log("✅ Successfully minted YES and NO shares!");
    });

    it("Merges YES and NO shares back into USDC (merge_shares)", async () => {
        const marketAccount = await program.account.market.fetch(marketPda);
        const mergeAmount = new anchor.BN(10_000_000); // 10 USDC worth of shares

        const userUsdcAta = getAssociatedTokenAddressSync(usdcMint, admin.publicKey);
        const userYesAta = getAssociatedTokenAddressSync(marketAccount.outcomeYesMint, admin.publicKey);
        const userNoAta = getAssociatedTokenAddressSync(marketAccount.outcomeNoMint, admin.publicKey);

        await program.methods
            .mergeShares(mergeAmount)
            .accountsPartial({
                user: admin.publicKey,
                market: marketPda,
                usdcMint: usdcMint,
                yesMint: marketAccount.outcomeYesMint,
                noMint: marketAccount.outcomeNoMint,
                userUsdcAta: userUsdcAta,
                userYesAta: userYesAta,
                userNoAta: userNoAta,
                vaultAuthority: vaultAuthority,
                vaultUsdcAta: getAssociatedTokenAddressSync(usdcMint, vaultAuthority, true),
                tokenProgram: TOKEN_PROGRAM_ID,
            })
            .rpc();

        const userUsdcBalance = await getAccount(provider.connection, userUsdcAta);
        assert.equal(Number(userUsdcBalance.amount), 10_000_000); // Got 10 USDC back!

        const userYesBalance = await getAccount(provider.connection, userYesAta);
        assert.equal(Number(userYesBalance.amount), 90_000_000); // 100 - 10 = 90

        console.log("✅ Successfully merged 10 YES + 10 NO shares back into 10 USDC!");
    });

    it("LP added to AMM pool", async () => {
        const marketAccount = await program.account.market.fetch(marketPda);
        const liquidityAmount = new anchor.BN(70_000_000); // 70 YES + 70 NO

        const lpYesAta = getAssociatedTokenAddressSync(marketAccount.outcomeYesMint, admin.publicKey);
        const lpNoAta = getAssociatedTokenAddressSync(marketAccount.outcomeNoMint, admin.publicKey);

        await program.methods
            .addLiquidity(liquidityAmount)
            .accountsPartial({
                lpProvider: admin.publicKey,
                market: marketPda,
                yesMint: marketAccount.outcomeYesMint,
                noMint: marketAccount.outcomeNoMint,
                lpYesAta: lpYesAta,
                lpNoAta: lpNoAta,
                vaultYesAta: marketAccount.vaultYes,
                vaultNoAta: marketAccount.vaultNo,
                vaultAuthority: vaultAuthority,
                tokenProgram: TOKEN_PROGRAM_ID, // Corrected parameter name
            })
            .rpc();

        const vaultYesBalance = await getAccount(provider.connection, marketAccount.vaultYes);
        const vaultNoBalance = await getAccount(provider.connection, marketAccount.vaultNo);

        assert.equal(Number(vaultYesBalance.amount), 70_000_000);
        assert.equal(Number(vaultNoBalance.amount), 70_000_000);

        console.log("✅ LP successfully added 70 YES + 70 NO to AMM pool");
    });

    it("Swap YES tokens for NO tokens", async () => {
        const marketAccount = await program.account.market.fetch(marketPda);

        const amountIn = new anchor.BN(10_000_000); // 10 YES

        const userYesAta = getAssociatedTokenAddressSync(marketAccount.outcomeYesMint, admin.publicKey);
        const userNoAta = getAssociatedTokenAddressSync(marketAccount.outcomeNoMint, admin.publicKey);

        await program.methods
            .swap(amountIn)
            .accountsPartial({
                user: admin.publicKey,
                market: marketPda,
                outcomeYesMint: marketAccount.outcomeYesMint,
                outcomeNoMint: marketAccount.outcomeNoMint,
                userSourceAta: userYesAta,
                userDestinationAta: userNoAta,
                vaultSourceAta: marketAccount.vaultYes,
                vaultDestinationAta: marketAccount.vaultNo,
                vaultAuthority: vaultAuthority,
                tokenProgram: TOKEN_PROGRAM_ID,
            })
            .rpc();

        const userYesBalance = await getAccount(provider.connection, userYesAta);
        const userNoBalance = await getAccount(provider.connection, userNoAta);

        assert.equal(Number(userYesBalance.amount), 10_000_000); // 20 remaining - 10 = 10
        assert.isAbove(Number(userNoBalance.amount), 20_000_000); // Received NO from swap

        console.log("✅ AMM Swap successful! YES -> NO");
    });

    it("Security Check: Fails to resolve market before resolution_time", async () => {
        try {
            await program.methods
                .resolveMarket(1)
                .accountsPartial({
                    market: marketPda,
                    oracle: admin.publicKey,
                })
                .rpc();

            assert.fail("Should have failed because resolution_time is in the future!");
        } catch (err: any) {
            const isExpected = err.message.includes("ResolutionTimeNotReached") || err.message.includes("custom program error");
            assert.ok(isExpected, "Expected ResolutionTimeNotReached error");
            console.log("✅ Security Check Passed: Premature market resolution correctly BLOCKED!");
        }
    });

    it("Creates an expired market and resolves it successfully", async () => {
        [expiredMarketPda] = anchor.web3.PublicKey.findProgramAddressSync(
            [
                Buffer.from("market"),
                admin.publicKey.toBuffer(),
                expiredMarketId.toArrayLike(Buffer, "le", 8),
            ],
            program.programId
        );

        [expiredVaultAuthority] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("vault"), expiredMarketPda.toBuffer()],
            program.programId
        );

        const vaultUsdcAta = getAssociatedTokenAddressSync(usdcMint, expiredVaultAuthority, true);
        const vaultYesAta = getAssociatedTokenAddressSync(expiredYesMint.publicKey, expiredVaultAuthority, true);
        const vaultNoAta = getAssociatedTokenAddressSync(expiredNoMint.publicKey, expiredVaultAuthority, true);

        // Resolution time in the past (-10 seconds)
        const pastResolutionTime = new anchor.BN(Math.floor(Date.now() / 1000) - 10);

        await program.methods
            .createMarket(expiredMarketId, admin.publicKey, pastResolutionTime, "Did Event X Happen?", "https://oracle.com")
            .accountsPartial({
                admin: admin.publicKey,
                market: expiredMarketPda,
                usdcMint: usdcMint,
                outcomeYesMint: expiredYesMint.publicKey,
                outcomeNoMint: expiredNoMint.publicKey,
                vaultAuthority: expiredVaultAuthority,
                vaultUsdcAta: vaultUsdcAta,
                vaultYesAta: vaultYesAta,
                vaultNoAta: vaultNoAta,
                systemProgram: anchor.web3.SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            })
            .signers([expiredYesMint, expiredNoMint])
            .rpc();

        // Now resolve successfully
        await program.methods
            .resolveMarket(1) // 1 = YES won
            .accountsPartial({
                market: expiredMarketPda,
                oracle: admin.publicKey,
            })
            .rpc();

        const marketAccount = await program.account.market.fetch(expiredMarketPda);
        assert.equal(marketAccount.isResolved, true);
        assert.equal(marketAccount.winningOutcome, 1);
        console.log("✅ Expired market resolved successfully with outcome: YES!");
    });

    it("Disputes the resolved market during dispute window", async () => {
        await program.methods
            .disputeMarket()
            .accountsPartial({
                disputer: admin.publicKey,
                market: expiredMarketPda,
            })
            .rpc();

        const marketAccount = await program.account.market.fetch(expiredMarketPda);
        assert.equal(marketAccount.isDisputed, true);
        assert.equal(marketAccount.disputedCount.toNumber(), 1);
        console.log("✅ Market disputed successfully during 48h dispute window!");
    });

    it("Admin resolves the dispute with resolve_dispute", async () => {
        await program.methods
            .resolveDispute(2) // Admin flips outcome to 2 (NO) or confirms outcome
            .accountsPartial({
                admin: admin.publicKey,
                market: expiredMarketPda,
            })
            .rpc();

        const marketAccount = await program.account.market.fetch(expiredMarketPda);
        assert.equal(marketAccount.isDisputed, false);
        assert.equal(marketAccount.winningOutcome, 2);
        console.log("✅ Admin successfully resolved dispute with final outcome: NO!");
    });
});
