import Arweave from "arweave";
import { JWKInterface } from "arweave/node/lib/wallet";
import TestWeave from "testweave-sdk";
import { DataAccount } from "../constants/index";

class ArweaveData {
	constructor(public message: string) {}
}

class ArweaveService {
	arweave: Arweave;
	testWeave?: TestWeave;
	walletKey?: JWKInterface;

	constructor() {
		this.arweave = Arweave.init({
			host: "localhost",
			port: 1984,
			protocol: "http",
		});

		TestWeave.init(this.arweave).then((testWeave) => {
			console.log(testWeave);

			this.testWeave = testWeave;
			this.walletKey = this.testWeave.rootJWK;
		});
	}

	async saveData(message: string): Promise<string> {
		// console.log("start saveData");
		const transaction = await this.arweave.createTransaction(
			{ data: message },
			this.walletKey!
		);
		// transaction.addTag("Content-Type", "text/plain");
		await this.arweave.transactions.sign(transaction, this.walletKey!);
		await this.arweave.transactions.post(transaction);
		// console.log("posted transaction");
		await this.testWeave!.mine(); // need this to force immediate mine of related block
		// console.log("forced mine");
		const status = await this.arweave.transactions.getStatus(
			transaction.id
		);
		// console.log("saveData status", status);
		return transaction.id;
	}

	async getData(chatMessage: DataAccount): Promise<string> {
		const message = await this.arweave.transactions.getData(
			chatMessage.id,
			{ decode: true, string: true }
		);

		return new Promise((resolve) => {
			resolve(message as string);
		});
	}
}

const arweaveService = new ArweaveService();
export default arweaveService;
