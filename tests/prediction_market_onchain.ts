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

    let vaultAuthority: anchor.web3.PublicKey;
    let vaultAuthorityBump: number;

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

        [vaultAuthority, vaultAuthorityBump] = anchor.web3.PublicKey.findProgramAddressSync(
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
        //const [testVaultAuthority] = anchor.web3.PublicKey.findProgramAddressSync(
        //   [Buffer.from("vault"), marketPda.toBuffer()],
        //  program.programId
        //);

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
                vaultAuthority: vaultAuthority, // FIX 3: Use derived PDA, NOT marketAccount.vaultYes
                vaultUsdcAta: getAssociatedTokenAddressSync(usdcMint, vaultAuthority, true),
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

    it("LP added to AMM pool", async () => {
        const marketAccount = await program.account.market.fetch(marketPda);

        const liquidityAmount = new anchor.BN(80_000_000);

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
                tokenPrgram: TOKEN_PROGRAM_ID
            })
            .rpc();

        // verify vault balance
        const vaultYesBalance = await getAccount(provider.connection, marketAccount.vaultYes);
        const vaultNoBalance = await getAccount(provider.connection, marketAccount.vaultNo);

        assert.equal(Number(vaultYesBalance.amount), 80_000_000);
        assert.equal(Number(vaultNoBalance.amount), 80_000_000);

        // verify LP wallet balance 
        const lpYesBalance = await getAccount(provider.connection, lpYesAta);
        const lpNoBalance = await getAccount(provider.connection, lpNoAta);

        assert.equal(Number(lpYesBalance.amount), 20_000_000);
        assert.equal(Number(lpNoBalance.amount), 20_000_000);

        console.log("LP successful added 80 YES + 80 NO to AMM pool");

    })

    it("Swap YES tokens for NO tokens", async () => {
        const marketAccount = await program.account.market.fetch(marketPda);

        const [derivedVaultAuthority, vaultBump] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("vault"), marketPda.toBuffer()],
            program.programId
        );

        // user already has 20 YES (from previous test) so we swap 10 yes for no
        const amountIn = new anchor.BN(10_000_000); // 10 YES

        const userYesAta = getAssociatedTokenAddressSync(marketAccount.outcomeYesMint, admin.publicKey);
        const userNoAta = getAssociatedTokenAddressSync(marketAccount.outcomeNoMint, admin.publicKey);

        await program.methods.swap(amountIn).accountsPartial({
            user: admin.publicKey,
            market: marketPda,
            outcomeYesMint: marketAccount.outcomeYesMint,
            outcomeNoMint: marketAccount.outcomeNoMint,
            userSourceAta: userYesAta,
            userDestinationAta: userNoAta,
            vaultSourceAta: marketAccount.vaultYes,
            vaultDestinationAta: marketAccount.vaultNo,
            vaultAuthority: derivedVaultAuthority,
            tokenProgram: TOKEN_PROGRAM_ID,
        })
            .rpc();


        // verify balances after swap
        const userYesBalance = await getAccount(provider.connection, userYesAta);
        const userNoBalance = await getAccount(provider.connection, userNoAta);

        // User ke paas 10 YES kam hone chahiye (20 - 10 = 10)
        assert.equal(Number(userYesBalance.amount), 10_000_000, "Yes balance should be 10 after swap");
        // User ke paas NO tokens badhne chahiye (20 + thoda sa, kyunki AMM price change hoga)
        assert.isAbove(Number(userNoBalance.amount), 20_000_000, "No balance should be greater than 20 after swap");

        console.log("✅ AMM Swap successful! YES -> NO");
        console.log(`   User YES balance: ${Number(userYesBalance.amount)}`);
        console.log(`   User NO balance: ${Number(userNoBalance.amount)}`);
    });

    it("Resolve the tmarket with YES as winner", async () => {
        await program.methods
            .resolveMarket(1) // 1 = yes wins
            .accountsPartial({
                market: marketPda,
                oracle: admin.publicKey
            })
            .rpc();

        const updateMarket = await program.account.market.fetch(marketPda);
        assert.equal(updateMarket.isResolved, true);
        assert.equal(updateMarket.winningOutcome, 1);
        console.log("Market resolved: Yes is the winner!");
    });

    it("Redeem winning YES tokens for USDC", async () => {
        const marketAccount = await program.account.market.fetch(marketPda);

        const userYesAta = getAssociatedTokenAddressSync(marketAccount.outcomeYesMint, admin.publicKey);
        const userUsdcAta = getAssociatedTokenAddressSync(marketAccount.usdcMint, admin.publicKey);
        const vaultUsdcAta = getAssociatedTokenAddressSync(marketAccount.usdcMint, vaultAuthority, true);

        const userYesBalanceBefore = await getAccount(provider.connection, userYesAta);
        const redeemAmount = Number(userYesBalanceBefore.amount);

        await program.methods
            .redeem()
            .accountsPartial({
                user: admin.publicKey,
                market: marketPda,
                winningMint: marketAccount.outcomeYesMint,
                userWinningAta: userYesAta,
                userUsdcAta: userUsdcAta,
                vaultUsdcAta: vaultUsdcAta,
                vaultAuthority: vaultAuthority,
                tokenProgram: TOKEN_PROGRAM_ID
            })
            .rpc();

        const userYesBalanceAfter = await getAccount(provider.connection, userYesAta);
        assert.equal(Number(userYesBalanceAfter.amount), 0)

        const userUsdcBalanceAfter = await getAccount(provider.connection, userUsdcAta);
        assert.equal(Number(userUsdcBalanceAfter.amount), redeemAmount);

        console.log(`Successfully redeem ${redeemAmount} YES token for USDC!`);
        console.log(` Final usdc balance: ${Number(userUsdcBalanceAfter.amount)} `);
    });
});
