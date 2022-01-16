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
	Transaction,
	TransactionError,
	ParsedConfirmedTransaction,
	ParsedMessageAccount,
} from "@solana/web3.js";
import * as borsh from "borsh";
import { RPC_URL, DataAccount, DataSchema } from "../constants/index";
import PhantomWallet from "../wallets/phantom";
import {
	pop_info,
	pop_error,
	sleep,
	timestampToString,
} from "../helpers/index";
import { POST_PROGRAM_ID, LIKE_PROGRAM_ID } from "../constants/index";
import { createFromSeed } from "../solana/account";
import { saveData } from "../solana/data";
import { likePost } from "../solana/like";
import { signAndConfirmTransaction } from "../solana/transaction";
import arweaveService from "../arweave/index";

export default defineComponent({
	data(): {
		solanaConn: Connection;
		wallet: PhantomWallet;
		walletAccountInfo: AccountInfo;
		derivedPubkey: PublicKey;
		derivedAccountInfo: AccountInfo;
		ArweaveId: string;
		transactinHistory: string[];
		derivedPubkeyStr: string;
		likeAccountList: string[];
	} {
		return {
			solanaConn: undefined as Connection,
			wallet: undefined as PhantomWallet,
			walletAccountInfo: undefined as AccountInfo,
			derivedPubkey: undefined as PublicKey,
			derivedAccountInfo: undefined as AccountInfo,
			ArweaveId: "Ar7SU71Gq4opQUiesBrZ9KaqV84ZAFp7e8hwJwgtoRb",
			transactinHistory: [],
			// derivedPubkeyStr: "5BDnrWZpYiPKWpMieu9U1HgbDJTNanTqs6cFf6ywgsZx",
			derivedPubkeyStr: "DWPqyHBbrLyihq2wJXGbe3SkL5zNn8VoS33PnM8xYirK",
			likeAccountList: [],
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
		likeProgramId() {
			return new PublicKey(LIKE_PROGRAM_ID);
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
				// assume we already heave an account store post data
				const postAccountPubKey = new PublicKey(this.derivedPubkeyStr);

				const limit = 1000;

				const confirmedSignatureInfo =
					await this.getSolanaConn.getSignaturesForAddress(
						postAccountPubKey,
						{ limit }
					);

				const transactionSignatures = confirmedSignatureInfo.map(
					(sigInfo) => sigInfo.signature
				);

				const parsedConfirmedTransactions =
					await this.getSolanaConn.getParsedConfirmedTransactions(
						transactionSignatures
					);

				parsedConfirmedTransactions.forEach(
					(tx: ParsedConfirmedTransaction, indx: number) => {
						this._parseTransaction(tx);
					}
				);
			})();
		},
		async _createLikeAccount() {
			const authorPubkey = new PublicKey(
				"8EDkN9f3mie9CUKYJET1EsLnTDB7tSABdt67hKFYJqFN"
			);

			const seed = "post123456_like";
			const space = 0;
			const pubkey = await PublicKey.createWithSeed(
				authorPubkey,
				seed,
				this.likeProgramId
			);

			const accountInfo = await this.getSolanaConn.getAccountInfo(pubkey);

			const lamports =
				await this.getSolanaConn.getMinimumBalanceForRentExemption(
					space
				);

			if (accountInfo) {
				console.log("like account info", accountInfo);
				return pubkey;
			}

			const instruction: TransactionInstruction =
				SystemProgram.createAccountWithSeed({
					fromPubkey: this.wallet.publicKey,
					basePubkey: this.wallet.publicKey,
					seed: seed,
					newAccountPubkey: pubkey,
					lamports: lamports,
					space: space,
					programId: this.likeProgramId,
				});

			const transaction = new Transaction();

			transaction.add(instruction);
			transaction.feePayer = this.wallet.publicKey;

			const res: SignatureResult = await signAndConfirmTransaction(
				this.getSolanaConn,
				this.wallet,
				transaction
			);

			console.log(res);

			return pubkey;
		},
		likePost(e: Event) {
			// likeAccountList is a list of publickey,
			// 1.post creator, 2.first liked user, 3.second liked user, 4.third liked user, ...
			// we have to option, one is transfer lamport to post account,
			// and let the post account transfer to likeAccountList in the like program
			// another is pass wallet as signer together with the likeAccountList to like program
			// do transfer in the program, not sure this is gonna work
			const acc1 = new PublicKey(
				"8EDkN9f3mie9CUKYJET1EsLnTDB7tSABdt67hKFYJqFN"
			);
			const acc2 = new PublicKey(
				"CL53P6J2hDRYFLCSun2zMcfsAYzUkUM1eGbzZK6y9z11"
			);
			const acc3 = new PublicKey(
				"AeQpkELUs1JdRxmwy2Z8thNNwtDccDD2TZDJfm51ps1D"
			);
			const acc4 = new PublicKey(
				"FRYy3jyZnZn1xLqJDt27PZDELRJqeBQQ4PtVBX4nBA7P"
			);

			(async () => {
				const likeAccountPubKey = await this._createLikeAccount();

				// console.log(likeAccountPubKey);
				if (false) {
					// transfer lamports to like account
					// when like, first tansfer users lamports to likeAccount
					const instruction = SystemProgram.transfer({
						fromPubkey: this.wallet.publicKey!,
						toPubkey: likeAccountPubKey,
						lamports: 1000,
					});

					const transaction = new Transaction();

					transaction.add(instruction);
					transaction.feePayer = this.wallet.publicKey;

					const res: SignatureResult =
						await signAndConfirmTransaction(
							this.getSolanaConn,
							this.wallet,
							transaction
						);

					console.log(res);
				}

				const acinfo1: AccountInfo<Buffer> =
					await this.getSolanaConn.getAccountInfo(acc1);

				const acinfo2: AccountInfo<Buffer> =
					await this.getSolanaConn.getAccountInfo(acc2);

				const acinfo3: AccountInfo<Buffer> =
					await this.getSolanaConn.getAccountInfo(acc3);

				const acinfo4: AccountInfo<Buffer> =
					await this.getSolanaConn.getAccountInfo(acc4);

				console.log(acinfo1, acinfo2, acinfo3, acinfo4);

				if (false) {
					// transfer lamports
					const likeRes = await likePost(
						this.getSolanaConn,
						this.wallet,
						[likeAccountPubKey, acc1, acc2, acc3],
						// [acc1, acc2, acc3],
						new PublicKey(LIKE_PROGRAM_ID)
					);

					console.log(likeRes);
				}
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
		_parseTransaction(tx: ParsedConfirmedTransaction) {
			let msg = "";
			const ins = tx.transaction.message.instructions[0];
			const accountKeys: ParsedMessageAccount[] =
				tx.transaction.message.accountKeys;

			if (ins.parsed) {
				// create new account action
				if (ins.parsed.type == "createAccountWithSeed") {
					msg +=
						"<strong>Create Account with seed: " +
						ins.parsed.info.seed +
						".</strong>";
				}
			} else if (ins.programId.toString() == POST_PROGRAM_ID) {
				// make new post action, save post arweaveid to account
				msg += "<strong>Make post.</strong>";

				const postAuthor = accountKeys[0];

				if (!postAuthor.signer) {
					pop_error("first account key is not a signer");
				}

				this.likeAccountList.push(postAuthor.pubkey);
			} else {
				console.log("Unknow action", ins);

				msg += "<strong>Unknow action.</strong>";
			}

			msg += timestampToString(tx.blockTime);

			accountKeys.forEach((ak) => {
				let pkStr = ak.pubkey.toString();

				if (pkStr == this.wallet.publicKey.toString()) {
					msg += "<p>Wallet public key: " + pkStr + "</p>";
				} else if (pkStr == POST_PROGRAM_ID) {
					msg += "<p>Post program public key: " + pkStr + "</p>";
				} else if (pkStr == this.derivedPubkeyStr) {
					msg +=
						"<p>Derived post account public key: " + pkStr + "</p>";
				} else if (pkStr == "11111111111111111111111111111111") {
					msg += "<p>System program: " + pkStr + "</p>";
				} else {
					msg += "<p>Unknown public key: " + pkStr + "</p>";
				}
			});

			this.transactinHistory.push(msg);
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
			<div v-for="msg in transactinHistory">
				<div v-html="msg"></div>
			</div>
		</div>
		<div>
			<button @click="likePost">like post</button>
			<div></div>
		</div>
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

.grid > div {
	min-height: 100px;
}

.grid div textarea {
	width: 100%;
	height: 100%;
}
</style>
<style>
p {
	margin: 4px 0;
}
</style>
