import {
	Connection,
	RpcResponseAndContext,
	SignatureResult,
	Transaction,
	SendTransactionError,
} from "@solana/web3.js";
import { WalletAdapter } from "../interfaces/index";
import { pop_error } from "../helpers/index";

export async function walletSignAndConfirmTransaction(
	conn: Connection,
	walletAdapter: WalletAdapter,
	transaction: Transaction
): Promise<SignatureResult> {
	try {
		// Fetch a recent blockhash from the cluster, deprecated
		// use getLatestBlockhash
		const hash = await conn.getRecentBlockhash();
		transaction.recentBlockhash = hash.blockhash;

		// console.log("start signAndSendTransaction");

		// how did it sign transaction?
		// https://github.com/project-serum/sol-wallet-adapter/blob/master/src/index.ts
		// it is not using private key
		// pay more attention to this, add as much log as I can
		let signature: string = await walletAdapter.signAndSendTransaction(
			conn,
			transaction
		);

		// console.log("signed transaction", signature);

		// Commitment: "processed" | "confirmed" | "finalized" | "recent" | "single" | "singleGossip" | "root" | "max"
		let result: RpcResponseAndContext<SignatureResult> =
			await conn.confirmTransaction(signature, "singleGossip");

		// console.log(result.value.err);

		return new Promise((resolve) => {
			resolve(result.value);
		});
	} catch (err) {
		pop_error((err as SendTransactionError).message);
		throw err;
	}
}
