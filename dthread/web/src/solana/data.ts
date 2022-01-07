import {
	Connection,
	PublicKey,
	SignatureResult,
	TransactionInstruction,
	Transaction,
} from "@solana/web3.js";
import * as borsh from "borsh";
import { WalletAdapter } from "../interfaces/index";
import { DataAccount, DataSchema } from "../constants/index";
import { signAndConfirmTransaction } from "./transaction";

export async function saveData(
	conn: Connection,
	walletAdapter: WalletAdapter,
	dataAccountPubkey: PublicKey,
	programId: PublicKey,
	data: string
): Promise<SignatureResult> {
	// console.log("save data to", dataAccountPubkey.toBase58());

	let messageAccount = new DataAccount();
	messageAccount.id = data;

	const instruction = new TransactionInstruction({
		keys: [
			{ pubkey: dataAccountPubkey, isSigner: false, isWritable: true },
		],
		programId,
		data: Buffer.from(borsh.serialize(DataSchema, messageAccount)), // All instructions are hellos
	});

	const transaction = new Transaction().add(instruction);

	transaction.feePayer = walletAdapter.publicKey!;

	return signAndConfirmTransaction(conn, walletAdapter, transaction);
}
