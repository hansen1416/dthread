<script lang="ts">
import { defineComponent, ref } from "vue";
import {
	AccountInfo,
	Connection,
	SystemProgram,
	clusterApiUrl,
	PublicKey,
	LAMPORTS_PER_SOL,
	MAX_SEED_LENGTH,
	SignatureResult,
	TransactionError,
} from "@solana/web3.js";
import * as borsh from "borsh";
import { RPC_URL, DataAccount, DataSchema } from "../constants/index";
import PhantomWallet from "../wallets/phantom";
import { pop_info, sleep } from "../helpers/index";
import { POST_PROGRAM_ID } from "../constants/index";
import { createFromSeed } from "../solana/account";
import { saveData } from "../solana/data";
import arweaveService from "../arweave/index";

export default defineComponent({
	data(): {
		solanaConn: Connection;
		wallet: PhantomWallet;
		walletAccountInfo: AccountInfo;
		derivedPubkey: PublicKey;
		derivedAccountInfo: AccountInfo;
		ArweaveId: string;
	} {
		return {
			solanaConn: undefined as Connection,
			wallet: undefined as PhantomWallet,
			walletAccountInfo: undefined as AccountInfo,
			derivedPubkey: undefined as PublicKey,
			derivedAccountInfo: undefined as AccountInfo,
			ArweaveId: "Ar7SU71Gq4opQUiesBrZ9KaqV84ZAFp7e8hwJwgtoRb",
		};
	},
	computed: {
		getSolanaConn: {
			get(): Connection {
				if (this.solanaConn === undefined) {
					this.solanaConn = new Connection(RPC_URL, "confirmed");
				}
				return this.solanaConn;
			},
		},
		lamportsSol() {
			return LAMPORTS_PER_SOL;
		},
		postProgramId() {
			return new PublicKey(POST_PROGRAM_ID);
		},
	},
	methods: {
		connectWallet(e: Event) {
			this.wallet = new PhantomWallet();

			this.wallet
				.connect()
				.then((publicKey: PublicKey) => {
					// pop_info("wallet connected");
				})
				.catch((e: any) => {
					if (e.message) {
						pop_info(e.message);
					} else {
						pop_info("unable to connect wallet");
					}
				});
		},
		getWalletAccountInfo(e: Event) {
			this._updateWalletInfo();
		},
		getPostAccountHistory(e: Event) {
			(async () => {
				if (this.derivedPubkey === undefined) {
					this.derivedPubkey = await createFromSeed(
						this.getSolanaConn,
						this.wallet,
						this.postProgramId,
						"post_account",
						47
					);
				}

				const limit = 1000;

				const confirmedSignatureInfo =
					await this.getSolanaConn.getSignaturesForAddress(
						this.derivedPubkey,
						{ limit }
					);

				const transactionSignatures = confirmedSignatureInfo.map(
					(sigInfo) => sigInfo.signature
				);
				const parsedConfirmedTransactions =
					await this.getSolanaConn.getParsedConfirmedTransactions(
						transactionSignatures
					);

				parsedConfirmedTransactions.forEach((tx, indx) => {
					console.log(indx);

					for (
						let i = 0;
						i < tx.transaction.message.accountKeys.length;
						i++
					) {
						console.log(
							tx.transaction.message.accountKeys[
								i
							].pubkey.toString()
						);
					}

					for (
						let i = 0;
						i < tx.transaction.message.instructions.length;
						i++
					) {
						const ins = tx.transaction.message.instructions[i];

						console.log(
							"instruction programId:",
							ins.programId.toString()
						);

						if (ins.parsed) {
							console.log(
								"parsed",
								ins.parsed.type,
								ins.parsed.info
							);
						} else if (ins.data) {
							console.log("data:", ins.data);

							// const aid: DataAccount = borsh.deserialize(
							// 	DataSchema,
							// 	DataAccount,
							// 	ins.data
							// );

							// console.log(aid);

							if (ins.accounts) {
								console.log(
									"acounts",
									ins.accounts[0].toString()
								);

								this.getSolanaConn
									.getAccountInfo(ins.accounts[0])
									.then(
										(accountInfo: AccountInfo<Buffer>) => {
											console.log(
												"AccountInfo",
												accountInfo
											);

											try {
												const aid: DataAccount =
													borsh.deserialize(
														DataSchema,
														DataAccount,
														accountInfo
													);

												console.log("account aid", aid);
											} catch (e) {
												console.log("error", e);
											}
										}
									);
							}
						} else {
							console.log("unknown", ins);
						}
					}
				});

				// console.log(parsedConfirmedTransactions);
			})();
		},
		createDerivedAccount(e: Event) {
			const space = 43 + 4; // plus 4 due to some data diffs between client and program

			(async () => {
				if (this.wallet == undefined) {
					this.wallet = new PhantomWallet();

					await this.wallet.connect();
				}

				this.derivedPubkey = await createFromSeed(
					this.getSolanaConn,
					this.wallet,
					this.postProgramId,
					"post_account",
					space
				);

				this._updateWalletInfo();
				this._updateDataAccountInfo();
			})();
		},
		saveArweaveId(e: Event) {
			saveData(
				this.getSolanaConn,
				this.wallet,
				this.derivedPubkey,
				this.postProgramId,
				this.ArweaveId
			)
				.then((res: SignatureResult) => {
					console.log(res);

					this._updateWalletInfo();
					this._updateDataAccountInfo();
				})
				.catch((e: TransactionError) => {
					console.error(e);
				});
		},
		_updateWalletInfo() {
			if (this.wallet && this.wallet.publicKey) {
				this.getSolanaConn
					.getAccountInfo(this.wallet.publicKey)
					.then((accountInfo: AccountInfo) => {
						if (accountInfo === null) {
							pop_info("No publickey information on cluster");
						} else {
							// accountInfo.owner.toString(),
							// owner is system account '11111111111111111111111111111111'
							this.walletAccountInfo = accountInfo;
						}
					})
					.catch((e: any) => {
						pop_info("get account info failed", e);
					});
			} else {
				pop_info("public key is not defined");
			}
		},
		_updateDataAccountInfo() {
			this.getSolanaConn
				.getAccountInfo(this.derivedPubkey)
				.then((accountInfo: AccountInfo<Buffer>) => {
					this.derivedAccountInfo = accountInfo;

					try {
						const aid: DataAccount = borsh.deserialize(
							DataSchema,
							DataAccount,
							this.derivedAccountInfo.data
						);

						this.derivedAccountData = aid.id;
					} catch (e) {
						this.derivedAccountData =
							this.derivedAccountInfo.data.toString("hex");
					}
				});
		},
	},
});
</script>
<template>
	<div class="grid">
		<div>
			<button @click="connectWallet">connect wallet</button>
			<div v-if="wallet && wallet.publicKey">
				<p>
					public key is:
					<span>{{ wallet.publicKey.toString() }}</span>
				</p>
			</div>
		</div>
		<div>
			<button @click="getWalletAccountInfo">
				get wallet account info
			</button>
			<div v-if="walletAccountInfo">
				<p>
					account owner is system program id
					<strong>{{ walletAccountInfo.owner.toString() }}</strong>
				</p>
				<p>
					wallet balance is:
					<strong
						>{{ walletAccountInfo.lamports / lamportsSol }}
					</strong>
					SOL
				</p>
				<p>
					account data length is
					<strong>{{ walletAccountInfo.data.byteLength }}</strong>
					bytes
				</p>
			</div>
		</div>
		<div>
			<button @click="getPostAccountHistory">
				get post account history
			</button>
		</div>
		<div></div>
		<div>
			<button @click="createDerivedAccount">
				create account with seed
			</button>
			<div v-if="derivedAccountInfo">
				<p>
					public key is
					<strong>{{ derivedPubkey.toString() }}</strong>
				</p>
				<p>
					account owner is program id
					<strong>{{ derivedAccountInfo.owner.toString() }}</strong>
				</p>
				<p>
					wallet balance is:
					<strong
						>{{ derivedAccountInfo.lamports / lamportsSol }}
					</strong>
					SOL
				</p>
				<p>
					account data length is
					<strong>{{ derivedAccountInfo.data.byteLength }}</strong>
					bytes
				</p>
				<p>
					account data:
					<strong>{{ derivedAccountData }}</strong>
				</p>
			</div>
		</div>
		<div>
			<button @click="saveArweaveId">send arweaveid to account</button>
			<div v-if="ArweaveId">
				<p>
					save Arweave id:
					<strong>{{ ArweaveId }}</strong>
				</p>
			</div>
		</div>
	</div>
</template>
<style scoped>
.grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
}

.grid div {
	height: 300px;
}

.grid div textarea {
	width: 100%;
	height: 100%;
}
</style>
