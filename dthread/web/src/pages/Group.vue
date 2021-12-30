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
			const wallet = new PhantomWallet();
			wallet
				.connect()
				.then((pubkey: PublicKey) => {
					console.log("onCreated", pubkey.toString());
				})
				.catch((e: any) => {
					if (e.message) {
						popInfo(e.message);
					} else {
						popInfo("unable to connect wallet");
					}
				});
		}
	},
	data() {
		return {};
	},
	computed: {},
	mounted() {},
});
</script>

<template>
	<div>group page</div>
</template>

<style scoped></style>
