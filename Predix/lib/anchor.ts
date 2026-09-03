import { Connection, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js"
import { Program, AnchorProvider,  Idl } from "@coral-xyz/anchor"

import idl from "@/idl/prediction_market_onchain.json";

export const connection = new Connection("https://api.devnet.solana.com", "confirmed");
export const PROGRAM_ID = new PublicKey("j3bfzTbouGfN1dUAcD81BpuzRKXt1jjqxJ86rk4ZybA");

export const getProgram = (
    publicKey: PublicKey,
    signTransaction: <T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>,
    signAllTransactions: <T extends Transaction | VersionedTransaction>(txs: T[]) => Promise<T[]>
) => {

    const wallet = {
        publicKey,
        signTransaction,
        signAllTransactions,
    } as any;

    const provider = new AnchorProvider(connection,wallet, {
        preflightCommitment: "processed",
        commitment: "processed",
    });

    // TODO: Fix the type issue with idl and PROGRAM_ID
    return new Program(idl as any, PROGRAM_ID as any, provider as any);
};

export const getVaultAuthority = (marketPda: PublicKey) => {
    const [vaultAuthorityPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), marketPda.toBuffer()],
        PROGRAM_ID
    );

    return vaultAuthorityPda;
}

