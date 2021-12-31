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
} from "@solana/web3.js";
import PhantomWallet from "../wallets/phantom";
import SolanaConnection from "../solana/connection";
import { popInfo } from "../helpers/notifications";

export default defineComponent({
	serverPrefetch() {},
	props: {
		username: String,
	},
	/**
  The new setup component option is executed before the component is created,
  once the props are resolved, and serves as the entry point for composition APIs.

  You should avoid using this inside setup as it won't refer to the component instance.
  setup is called before data properties, computed properties or methods are resolved,
  so they won't be available within setup.

  window is not defined
  */
	setup(props) {
		if (import.meta.env.SSR) {
		} else {
		}
	},
	// `beforeCreate` run after `setup`
	beforeCreate() {},
	// `created run after` `beforeCreate`
	created() {
		if (!import.meta.env.SSR) {
			this.solanaConn = new SolanaConnection();
		}
	},
	data(): {
		solanaConn: SolanaConnection;
		wallet: PhantomWallet;
		pubKey: PublicKey;
		walletBalance: number;
	} {
		return {
			solanaConn: undefined as SolanaConnection,
			wallet: undefined as PhantomWallet,
			pubKey: undefined as PublicKey,
			walletBalance: 0,
		};
	},
	computed: {},
	mounted() {
		// console.log(LAMPORTS_PER_SOL, MAX_SEED_LENGTH);
	},
	methods: {
		connectWallet(e: Event) {
			this.wallet = new PhantomWallet();

			this.wallet
				.connect()
				.then((publicKey: PublicKey) => {
					this.pubKey = publicKey;
				})
				.catch((e: any) => {
					if (e.message) {
						popInfo(e.message);
					} else {
						popInfo("unable to connect wallet");
					}
				});
		},
		disconnectWallet(e: Event) {
			if (this.wallet) {
				this.wallet.disconnect().then((res: boolean) => {
					if (res) {
						this.wallet = undefined;
						this.pubKey = undefined;

						popInfo("wallet disconnected");
					}
				});
			} else {
				popInfo("wallet not connected");
			}
		},
		getWalletBalance(e: Event) {
			if (this.pubKey) {
				this.solanaConn.conn
					.getBalance(this.pubKey)
					.then((balance: number) => {
						this.walletBalance = balance;
					})
					.catch((e: any) => {
						popInfo("get account balance failed", e);
					});
			} else {
				popInfo("public key is not defined");
			}
		},
		getAccountInfo(e: Event) {
			if (this.pubKey) {
				this.solanaConn.conn
					.getAccountInfo(this.pubKey)
					.then((accountInfo: AccountInfo) => {
						// accountInfo.owner.toString(),
						// owner is system account '11111111111111111111111111111111'
						console.info(accountInfo);
					})
					.catch((e: any) => {
						popInfo("get account info failed", e);
					});
			} else {
				popInfo("public key is not defined");
			}
		},
		createDerivedAccount(e: Event) {
			/**
			 * Derive a public key from another key, a seed, and a program ID.
			 * The program ID will also serve as the owner of the public key, giving
			 * it permission to write data to the account.
			 */
			// !!! create an publickey that is owned by `programId`, and associate with the `wallet.publicKey`
			// CHAT_SEED is some fixed value
			// e.g. in our case, we can create an account from user publick key, program id and group name
			// this way, we'd have an entrypoint account we fetch the initial data of a certain user,
			// the initial data is going to be a hash, the actual content is stored in IPFS/Arweave
			// PublicKey.createWithSeed(
			// 	wallet.publicKey,
			// 	CHAT_SEED,
			// 	programId
			// ).then((res) => {
			// 	console.log(res);
			// });
		},
	},
});
</script>

<template>
	<div>
		<button @click="connectWallet">connect wallet</button>
	</div>
	<div>
		<button @click="getWalletBalance">get wallet balance</button>
	</div>
	<div>
		<button @click="getAccountInfo">get account info</button>
	</div>
	<div>
		<button @click="disconnectWallet">disconnect wallet</button>
	</div>
	<div v-if="pubKey">
		<p>
			public key is: <span>{{ pubKey.toString() }}</span>
		</p>
	</div>
	<div v-if="walletBalance">
		<p>
			balance is: <span>{{ walletBalance }}</span>
		</p>
	</div>
</template>

<style scoped></style>
