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
import { popInfo } from "../helpers/notifications";
import { GROUPS_PROGRAM_ID } from "../constants/index";
import { createFromSeed } from "../solana/account";
import { RPC_URL } from "../constants/index";

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
		}
	},
	data(): {
		solanaConn: Connection;
		wallet: PhantomWallet;
		walletBalance: number;
	} {
		return {
			solanaConn: undefined as Connection,
			wallet: undefined as PhantomWallet,
			walletBalance: 0,
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
	},
	mounted() {
		// console.log(LAMPORTS_PER_SOL, MAX_SEED_LENGTH);
	},
	methods: {
		connectWallet(e: Event) {
			this.wallet = new PhantomWallet();

			this.wallet
				.connect()
				.then((publicKey: PublicKey) => {
					popInfo("wallet connected");
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

						popInfo("wallet disconnected");
					}
				});
			} else {
				popInfo("wallet not connected");
			}
		},
		getWalletBalance(e: Event) {
			if (this.wallet && this.wallet.publicKey) {
				this.getSolanaConn
					.getBalance(this.wallet.publicKey)
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
			if (this.wallet && this.wallet.publicKey) {
				this.getSolanaConn
					.getAccountInfo(this.wallet.publicKey)
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
			const GROUP_SEED = "abcgroup";
			const space = 32;

			createFromSeed(
				this.getSolanaConn,
				this.wallet,
				new PublicKey(GROUPS_PROGRAM_ID),
				GROUP_SEED,
				space
			).then(() => {
				console.log("");
			});
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
	<div>
		<button @click="createDerivedAccount">create account with seed</button>
	</div>
	<div v-if="wallet && wallet.publicKey">
		<p>
			public key is: <span>{{ wallet.publicKey.toString() }}</span>
		</p>
	</div>
	<div v-if="walletBalance">
		<p>
			balance is: <span>{{ walletBalance }}</span>
		</p>
	</div>
</template>

<style scoped></style>
