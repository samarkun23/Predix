import { Connection, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js"
import { Program, AnchorProvider,  Idl } from "@coral-xyz/anchor"

import idl from "@/idl/prediction_market_onchain.json";

console.log("IDL Loaded:", idl.metadata?.name, "Accounts:", idl.accounts?.length);

export const connection = new Connection("https://api.devnet.solana.com", "confirmed");
export const PROGRAM_ID = new PublicKey("j3bfzTbouGfN1dUAcD81BpuzRKXt1jjqxJ86rk4ZybA");

const fixedIdl = {
    ...(idl as any),
    address: "j3bfzTbouGfN1dUAcD81BpuzRKXt1jjqxJ86rk4ZybA",
    accounts: (idl as any).accounts.map((acc: any) => {
        const typeDef = (idl as any).types.find((t: any) => t.name === acc.type);
        if(typeDef) {
            return {...acc, type: typeDef.type};
        }
        return acc;
    })
} as Idl;

export const getProgram = (
    publicKey: PublicKey,
    signTransaction: any,
    signAllTransactions: any
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
    return new Program(fixedIdl as any, provider as any) as any;
};

export const getVaultAuthority = (marketPda: PublicKey) => {
    const [vaultAuthorityPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), marketPda.toBuffer()],
        PROGRAM_ID
    );

    return vaultAuthorityPda;
}

