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
}
