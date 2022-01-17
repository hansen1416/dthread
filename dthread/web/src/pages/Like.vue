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
import { LIKE_PROGRAM_ID } from "../constants/index";
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
		likeAccountPubkey: PublicKey;
		likeAccountInfo: AccountInfo;
		transactinHistory: string[];
		likeAccountList: PublicKey[];
		likeAccountInfoList: AccountInfo[];
	} {
		return {
			solanaConn: undefined as Connection,
			wallet: undefined as PhantomWallet,
			walletAccountInfo: undefined as AccountInfo,
			likeAccountPubkey: undefined as PublicKey,
			likeAccountInfo: undefined as AccountInfo,
			transactinHistory: [],
			likeAccountList: [],
			likeAccountInfoList: [],
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

		getLikeAccountHistory(e: Event) {
			this.transactinHistory = [];
			this.likeAccountList = [this.likeAccountPubkey];
			(async () => {
				// assume we already heave an account store post data
				// this.likeAccountPubkey
				const limit = 1000;

				const confirmedSignatureInfo =
					await this.getSolanaConn.getSignaturesForAddress(
						this.likeAccountPubkey,
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

		likePost(e: Event) {
			// likeAccountList is a list of publickey,
			// 1.post creator, 2.first liked user, 3.second liked user, 4.third liked user, ...
			// we have to option, one is transfer lamport to post account,
			// and let the post account transfer to likeAccountList in the like program
			// another is pass wallet as signer together with the likeAccountList to like program
			// do transfer in the program, not sure this is gonna work

			(async () => {
				await this._updateLikeAccountList();

				if (true) {
					// transfer lamports to like account
					// when like, first tansfer users lamports to likeAccount
					const instruction = SystemProgram.transfer({
						fromPubkey: this.wallet.publicKey!,
						toPubkey: this.likeAccountPubkey,
						lamports: (this.likeAccountList.length - 1) * 10,
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

					console.log("transfer from wallet to like account", res);
				}

				this._updateWalletInfo();

				this._updateLikeAccountList();

				if (true) {
					// transfer lamports
					const likeRes = await likePost(
						this.getSolanaConn,
						this.wallet,
						this.likeAccountList,
						new PublicKey(LIKE_PROGRAM_ID)
					);
				}

				this._updateWalletInfo();

				this._updateLikeAccountList();
			})();
		},
		async getLikeAccount(e: Event) {
			const authorPubkey = new PublicKey(
				"8EDkN9f3mie9CUKYJET1EsLnTDB7tSABdt67hKFYJqFN"
			);

			const seed = "post123456_like";
			const space = 0;
			this.likeAccountPubkey = await PublicKey.createWithSeed(
				authorPubkey,
				seed,
				this.likeProgramId
			);

			if (this.likeAccountList[0]) {
				this.likeAccountList[0] = this.likeAccountPubkey;
			} else {
				this.likeAccountList.push(this.likeAccountPubkey);
			}

			this.likeAccountInfo = await this.getSolanaConn.getAccountInfo(
				this.likeAccountPubkey
			);

			const lamports =
				await this.getSolanaConn.getMinimumBalanceForRentExemption(
					space
				);

			if (this.likeAccountInfo) {
				return this.likeAccountPubkey;
			}

			const instruction: TransactionInstruction =
				SystemProgram.createAccountWithSeed({
					fromPubkey: this.wallet.publicKey,
					basePubkey: this.wallet.publicKey,
					seed: seed,
					newAccountPubkey: this.likeAccountPubkey,
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

			// console.log(res);

			return this.likeAccountPubkey;
		},
		async _updateLikeAccountList() {
			for (let i in this.likeAccountList) {
				this.likeAccountInfoList[i] =
					await this.getSolanaConn.getAccountInfo(
						this.likeAccountList[i]
					);
			}
		},
		_parseTransaction(tx: ParsedConfirmedTransaction) {
			let msg = "";
			const ins = tx.transaction.message.instructions[0];
			const accountKeys: ParsedMessageAccount[] =
				tx.transaction.message.accountKeys;

			if (ins.programId.toString() == LIKE_PROGRAM_ID) {
				// make new post action, save post arweaveid to account
				msg += "<strong>Like post.</strong>";

				const postAuthor = accountKeys[0];

				if (!postAuthor.signer) {
					pop_error("first account key is not a signer");
				}
				// first like action
				if (this.likeAccountList.length == 1) {
					for (let i = 2; i < accountKeys.length - 1; i++) {
						if (
							!this.likeAccountList.includes(
								accountKeys[i].pubkey
							)
						) {
							this.likeAccountList.push(accountKeys[i].pubkey);
						}
					}
					if (!this.likeAccountList.includes(accountKeys[0].pubkey)) {
						// signer account is the last liked user
						this.likeAccountList.push(accountKeys[0].pubkey);
					}
				}
			} else if (ins.parsed) {
				// create new account action

				msg +=
					"<strong>System program action: " +
					ins.parsed.type +
					".</strong>";
				if (ins.parsed.type == "createAccountWithSeed") {
					const authorPubkey = new PublicKey(ins.parsed.info.base);

					if (this.likeAccountList.length == 1) {
						this.likeAccountList.push(authorPubkey);
					}
				}
			} else {
				console.log("Unknow action", ins);

				msg += "<strong>Unknow action.</strong>";
			}

			msg += timestampToString(tx.blockTime);

			accountKeys.forEach((ak) => {
				let pkStr = ak.pubkey.toString();

				if (pkStr == this.wallet.publicKey.toString()) {
					msg += "<p>Wallet public key: " + pkStr + "</p>";
				} else if (pkStr == LIKE_PROGRAM_ID) {
					msg += "<p>Like program public key: " + pkStr + "</p>";
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
					<strong class="blue"
						>{{ walletAccountInfo.lamports }}
					</strong>
					Lamports
				</p>
				<p>
					account data length is
					<strong>{{ walletAccountInfo.data.byteLength }}</strong>
					bytes
				</p>
			</div>
		</div>
		<div>
			<button @click="getLikeAccount">
				get like account (with seed)
			</button>
			<div v-if="likeAccountInfo">
				<p>
					public key is
					<strong>{{ likeAccountPubkey.toString() }}</strong>
				</p>
				<p>
					account owner is program id
					<strong>{{ likeAccountInfo.owner.toString() }}</strong>
				</p>
				<p>
					wallet balance is:
					<strong
						>{{ likeAccountInfo.lamports / lamportsSol }}
					</strong>
					SOL
				</p>
				<p>
					account data length is
					<strong>{{ likeAccountInfo.data.byteLength }}</strong>
					bytes
				</p>
			</div>
		</div>
		<div>
			<button @click="likePost">like post</button>
			<div>
				<div v-for="(pk, indx) in likeAccountList">
					<p v-if="pk">{{ pk.toString() }}</p>
					<p v-if="likeAccountInfoList[indx]">
						Balance:
						<strong class="blue">{{
							likeAccountInfoList[indx].lamports
						}}</strong>
					</p>
				</div>
			</div>
		</div>
		<div>
			<button @click="getLikeAccountHistory">
				get like account history
			</button>
			<div v-for="msg in transactinHistory">
				<div v-html="msg"></div>
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

.grid div .blue {
	color: #0000ee;
}
</style>
<style>
p {
	margin: 4px 0;
}
</style>
