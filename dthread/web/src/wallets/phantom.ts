import {
	Connection,
	PublicKey,
	Transaction,
	SignatureResult,
} from "@solana/web3.js";
import { RPC_URL } from "../constants/index";
import { WalletAdapter } from "../interfaces/index";

/**
 * phantom wallet adapter
 */
export default class PhantomWallet implements WalletAdapter {
	provider: any;
	publicKey: PublicKey | null;

	constructor() {
		this.publicKey = null;

		if ("solana" in window) {
			const provider = window.solana;
			if (provider.isPhantom) {
				this.provider = provider;
			} else {
				throw new Error("no phantom provider");
			}
		} else {
			throw new Error("no provider");
		}
	}

	async connect(): Promise<PublicKey> {
		/**
		 * After a web application connects to Phantom for the first time it becomes trusted,
		 * and it is possible for the application to automatically connect to Phantom on subsequent visits,
		 * or page refreshes. This is often called "eagerly connecting".
		 * To implement this, pass `onlyIfTrusted: true` to connect().
		 */
		const { publicKey }: { publicKey: PublicKey } =
			await this.provider.connect({
				RPC_URL,
				onlyIfTrusted: import.meta.env.PROD,
			});

		this.publicKey = publicKey;

		return new Promise<PublicKey>((resolve) => {
			resolve(publicKey);
		});
	}

	async disconnect(): Promise<boolean> {
		await this.provider.disconnect();

		return new Promise((resolve) => {
			resolve(true);
		});
	}

	async signAndSendTransaction(
		connection: Connection,
		transaction: Transaction
	): Promise<string> {
		// the reconneced method is `signAndSendTransaction`
		// but it gives error -32003 RPC Error, transaction creation failed
		const signedTransaction: Transaction =
			await this.provider.signTransaction(transaction);

		const signature: string = await connection.sendRawTransaction(
			signedTransaction.serialize()
		);

		return new Promise((resolve) => {
			resolve(signature);
		});
	}
}
