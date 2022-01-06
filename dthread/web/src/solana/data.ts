import {
	Connection,
	PublicKey,
	RpcResponseAndContext,
	SignatureResult,
	TransactionInstruction,
	Transaction,
} from "@solana/web3.js";
import { WalletAdapter } from "../interfaces/index";
import * as borsh from "borsh";

class DataAccount {
	data: string = "";
	constructor(fields: { data: string } | undefined = undefined) {
		if (fields) {
			this.data = fields.data;
		}
	}
}

/**
 * Borsh schema definition for greeting accounts
 */
const DataSchema = new Map([
	[DataAccount, { kind: "struct", fields: [["data", "String"]] }],
]);

export async function saveData(
	conn: Connection,
	walletAdapter: WalletAdapter,
	data: string,
	dataAccountPubkey: PublicKey,
	programId: PublicKey
): Promise<void> {
	console.log("save data to", dataAccountPubkey.toBase58());
	let messageAccount = new DataAccount();
	messageAccount.data = data;
	const instruction = new TransactionInstruction({
		keys: [
			{ pubkey: dataAccountPubkey, isSigner: false, isWritable: true },
		],
		programId,
		data: Buffer.from(borsh.serialize(DataSchema, messageAccount)), // All instructions are hellos
	});

	const transaction = new Transaction().add(instruction);

	try {
		console.log("start signAndSendTransaction");
		// how did it sign transaction?
		// https://github.com/project-serum/sol-wallet-adapter/blob/master/src/index.ts
		// it is not using private key
		// pay more attention to this, add as much log as I can
		let signature: string = await walletAdapter.signAndSendTransaction(
			conn,
			transaction
		);
		console.log("signed transaction", signature);
		// Commitment: "processed" | "confirmed" | "finalized" | "recent" | "single" | "singleGossip" | "root" | "max"
		let result: RpcResponseAndContext<SignatureResult> =
			await conn.confirmTransaction(signature, "singleGossip");

		console.log(result);
	} catch (err) {
		console.log("signAndSendTransaction error", err);
		throw err;
	}
}
