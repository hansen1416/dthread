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
// import { LIKE_PROGRAM_ID } from "../constants/index";
import { createFromSeed } from "../solana/account";
import { walletSignAndConfirmTransaction } from "../solana/transaction";
import { MintLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import bs58 from `bs58`;

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
		// likeProgramId() {
		// 	return new PublicKey(LIKE_PROGRAM_ID);
		// },
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
		createSPLToken(e: Event) {

			// // const publicKey = "8EDkN9f3mie9CUKYJET1EsLnTDB7tSABdt67hKFYJqFN";
			const secretKey =
				"YtvHQLwHyZufhGxNESTMKawLGES6uQz5kbnNaRKZzkYKmun1ekMdfnhpf2w8fyEVeakQFDJ4j9i1Sv2LAUH1x3A";


			const kp = Keypair.fromSecretKey(bs58.decode(secretKey));

			console.log(kp.publicKey.toString());
		},
		createSPLTokenAccount(e: Event) {
			// const mintPubKey = new PublicKey(
			// 	"DCJpJBGzv8aXKo9FE4RJWqJSots28AkW2evy5DZNxxtx"
			// );
			// // Allocate memory for the account
			// const balanceNeeded = await Token.getMinBalanceRentForExemptMint(
			// 	this.getSolanaConn
			// );
			// const transaction = new Transaction();
			// transaction.add(
			// 	SystemProgram.createAccount({
			// 		fromPubkey: this.wallet.publicKey,
			// 		newAccountPubkey: mintPubKey,
			// 		lamports: balanceNeeded,
			// 		space: MintLayout.span,
			// 		programId: TOKEN_PROGRAM_ID,
			// 	})
			// );
			// transaction.feePayer = this.wallet.publicKey;
			// const hash = await this.getSolanaConn.getRecentBlockhash();
			// transaction.recentBlockhash = hash.blockhash;
			// const signature: string = await walletSignAndConfirmTransaction(
			// 	this.getSolanaConn,
			// 	this.wallet,
			// 	transaction
			// );
			// console.log(signature);
		},
		createSPLTokenByWallet(e: Event) {
			(async () => {
				// Create new token mint
				const mintAccount = Keypair.generate();

				const token = new Token(
					this.getSolanaConn,
					mintAccount.publicKey,
					TOKEN_PROGRAM_ID,
					this.wallet.publicKey
				);

				// Allocate memory for the account
				const balanceNeeded =
					await Token.getMinBalanceRentForExemptMint(
						this.getSolanaConn
					);

				const transaction = new Transaction();
				transaction.add(
					SystemProgram.createAccount({
						fromPubkey: this.wallet.publicKey,
						newAccountPubkey: mintAccount.publicKey,
						lamports: balanceNeeded,
						space: MintLayout.span,
						programId: TOKEN_PROGRAM_ID,
					})
				);

				transaction.add(
					Token.createInitMintInstruction(
						TOKEN_PROGRAM_ID,
						mintAccount.publicKey,
						9,
						this.wallet.publicKey,
						null
					)
				);

				transaction.feePayer = this.wallet.publicKey;

				const hash = await this.getSolanaConn.getRecentBlockhash();
				transaction.recentBlockhash = hash.blockhash;

				const signature: string = await walletSignAndConfirmTransaction(
					this.getSolanaConn,
					this.wallet,
					transaction
				);

				/*
                It's not possible to create SPL token from web wallet, it throws an exception

                transaction.ts:583 Uncaught (in promise) Error: Signature verification failed
                at Transaction.serialize (transaction.ts:583:13)
                at Proxy.signAndSendTransaction (phantom.ts:70:22)
                at async walletSignAndConfirmTransaction (transaction.ts:28:27)
                at async SPLToken.vue:144:31
                */

				console.log(signature);
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
			<button @click="createSPLToken">create SPL token</button>
			<div></div>
		</div>
		<div>
			<button @click="() => {}">placeholder</button>
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
