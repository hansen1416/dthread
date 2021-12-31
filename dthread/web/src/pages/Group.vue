<script lang="ts">
import { defineComponent, ref } from "vue";
// import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
	Connection,
	SystemProgram,
	clusterApiUrl,
	PublicKey,
} from "@solana/web3.js";
import PhantomWallet from "../assets/phantom";
import SolanaConnection from "../solana/connection";
import { popInfo } from "../helpers/notifications";

// interface Book {
//   title: string
//   author: string
//   year: number
// }

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
		pubKey: string;
		walletBalance: number;
	} {
		return {
			solanaConn: undefined as SolanaConnection,
			wallet: undefined as PhantomWallet,
			pubKey: "",
			walletBalance: 0,
		};
	},
	computed: {},
	mounted() {},
	methods: {
		connectWallet(e: Event) {
			this.wallet = new PhantomWallet();

			this.wallet
				.connect()
				.then((pubkey: PublicKey) => {
					this.pubKey = pubkey.toString();

					// console.log(this.wallet.provider.publicKey);

					this.solanaConn.getBalance(pubkey).then((balance) => {
						this.walletBalance = balance;
					});
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
						this.pubKey = "";

						popInfo("wallet disconnected");
					}
				});
			}
		},
	},
});
</script>

<template>
	<div>
		<button @click="connectWallet">connect wallet</button>
	</div>
	<div>
		<button @click="disconnectWallet">disconnect wallet</button>
	</div>
	<div v-if="pubKey">
		<p>
			public key is: <span>{{ pubKey }}</span>
		</p>
		<p>
			balance is: <span>{{ walletBalance }}</span>
		</p>
	</div>
</template>

<style scoped></style>
