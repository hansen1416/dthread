import { Connection, PublicKey, Transaction } from "@solana/web3.js";

export interface WalletAdapter {
	publicKey: PublicKey | null;
	connect: () => Promise<PublicKey>;
	disconnect: () => Promise<boolean>;
	signAndSendTransaction: (
		connection: Connection,
		transaction: Transaction
	) => Promise<string>;
}
