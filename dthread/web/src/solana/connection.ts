import { PublicKey, Connection } from "@solana/web3.js";
import { RPC_URL } from "../constants/index";

/**
 * A connection to a fullnode JSON RPC endpoint
 */
export default class SolanaConnection {
	conn: Connection;

	constructor() {
		this.conn = new Connection(RPC_URL, "confirmed");
	}

	async getBalance(publicKey: PublicKey): Promise<number> {
		const balance: number = await this.conn.getBalance(publicKey);

		return new Promise((resolve) => {
			resolve(balance);
		});
	}
}
