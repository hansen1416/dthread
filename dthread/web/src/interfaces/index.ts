import { PublicKey, Transaction } from "@solana/web3.js";

export interface WalletAdapter {
	publicKey?: PublicKey;
	// signTransaction: (transaction: Transaction) => Promise<Transaction>;
	connect: () => Promise<PublicKey>;
	disconnect: () => Promise<boolean>;
}
