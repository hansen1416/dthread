import { PublicKey, Connection } from "@solana/web3.js";

const RPC_URL = "http://127.0.0.1:8899";

export default class PhantomWallet {
	provider: any;
	// pubkey?: string;

	constructor() {
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

	async getBalance(): Promise<number> {
		const connection = new Connection(RPC_URL, "confirmed");

		const balance: number = await connection.getBalance(
			this.provider.publicKey
		);

		return new Promise((resolve) => {
			resolve(balance);
		});
	}
}
