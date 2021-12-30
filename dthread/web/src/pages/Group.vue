<script lang="ts">
import { defineComponent, ref } from "vue";
// import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
	Connection,
	SystemProgram,
	clusterApiUrl,
	PublicKey,
} from "@solana/web3.js";

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
	created() {},
	data() {
		return {};
	},
	computed: {},
	mounted() {
		if (!import.meta.env.SSR) {
			(async () => {
				let connection = new Connection(clusterApiUrl("devnet"));
				let providerUrl = "https://www.sollet.io";
				// let wallet = new Wallet(providerUrl);

				// console.log(connection);

				// wallet.on('connect', (publicKey: PublicKey) => {
				//   console.log('Connected to ' + publicKey.toBase58());
				// });

				// wallet.on('disconnect', () => {
				//   console.log('Disconnected')
				// });

				// await wallet.connect();

				// let transaction = SystemProgram.transfer({
				//   fromPubkey: wallet.publicKey,
				//   toPubkey: wallet.publicKey,
				//   lamports: 100,
				// });

				// let { blockhash } = await connection.getRecentBlockhash();

				// console.log('blockhash', blockhash);

				// transaction.recentBlockhash = blockhash;

				// let signed = await wallet.signTransaction(transaction);
				// let txid = await connection.sendRawTransaction(signed.serialize());

				// console.log('signed', signed);
				// console.log('txid', txid);

				// const res = await connection.confirmTransaction(txid);

				// console.log('res', res);
			})();
		}
	},
});
</script>

<template>
	<div>group page</div>
</template>

<style scoped></style>
