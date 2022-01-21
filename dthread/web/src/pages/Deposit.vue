<script lang="ts">
import { defineComponent, ref } from "vue";
import {
	AccountInfo,
	Connection,
	SystemProgram,
	clusterApiUrl,
	PublicKey,
	Keypair,
	LAMPORTS_PER_SOL,
	MAX_SEED_LENGTH,
	SignatureResult,
	Transaction,
	TransactionError,
	ParsedConfirmedTransaction,
	ParsedMessageAccount,
	sendAndConfirmTransaction,
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
import { walletSignAndConfirmTransaction } from "../solana/transaction";
import arweaveService from "../arweave/index";

export default defineComponent({
	data(): {
		solanaConn: Connection;
		wallet: PhantomWallet;
		walletAccountInfo: AccountInfo;
		groupAccount: PublicKey;
	} {
		return {
			solanaConn: undefined as Connection,
			wallet: undefined as PhantomWallet,
			walletAccountInfo: undefined as AccountInfo,
			groupAccount: undefined as PublicKey,
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
		createGroupAccount(e: Event) {
			(async () => {
				const seed = "wallet";

				this.groupAccount = await PublicKey.createWithSeed(
					this.wallet.publicKey,
					seed,
					this.likeProgramId
				);

				const space = 0;

				const lamports =
					await this.getSolanaConn.getMinimumBalanceForRentExemption(
						space
					);

				let derivedAccountInfo: AccountInfo<Buffer> | null =
					await this.getSolanaConn.getAccountInfo(this.groupAccount);
				// if the derived account is created already
				// we read its account info and return
				// the owner of this account is the programId
				if (derivedAccountInfo) {
					return new Promise((resolve) => {
						resolve(this.groupAccount);
					});
				}

				const instruction: TransactionInstruction =
					SystemProgram.createAccountWithSeed({
						fromPubkey: this.wallet.publicKey,
						basePubkey: this.wallet.publicKey,
						seed: seed,
						newAccountPubkey: this.groupAccount,
						lamports: lamports,
						space: space,
						programId: this.likeProgramId,
					});

				// console.log(instruction);

				// for (let i in [0, 1]) {
				// 	console.log(instruction.keys[i].pubkey.toString());
				// 	// 0, wallet pubkey
				// 	// 1, derived public key
				// }

				// return;

				const transaction = new Transaction();

				transaction.add(instruction);
				transaction.feePayer = this.wallet.publicKey;

				const res: SignatureResult =
					await walletSignAndConfirmTransaction(
						this.getSolanaConn,
						this.wallet,
						transaction
					);

				console.log(res);
			})();
		},
		payByGroupAccount() {
			(async () => {
				let groupAccountInfo: AccountInfo<Buffer> | null =
					await this.getSolanaConn.getAccountInfo(this.groupAccount);

				console.log(groupAccountInfo);
				console.log(sendAndConfirmTransaction);
			})();
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
			<button @click="createGroupAccount">create group account</button>
			<div>
				<p v-if="groupAccount">
					<strong>{{ groupAccount.toString() }}</strong>
				</p>
			</div>
		</div>
		<div>
			<button @click="payByGroupAccount">pay by group account</button>
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
