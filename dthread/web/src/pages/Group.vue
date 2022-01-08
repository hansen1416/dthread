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
import PhantomWallet from "../wallets/phantom";
import { pop_info, random_string } from "../helpers/index";
import { GROUPS_PROGRAM_ID } from "../constants/index";
import { createFromSeed } from "../solana/account";
import { saveData } from "../solana/data";
import { RPC_URL, DataAccount, DataSchema } from "../constants/index";

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
		walletAccountInfo: AccountInfo;
		derivedPubkey: PublicKey;
		derivedAccountInfo: AccountInfo;
		derivedAccountData: String;
		pseudoId: String;
	} {
		return {
			solanaConn: undefined as Connection,
			wallet: undefined as PhantomWallet,
			walletAccountInfo: undefined as AccountInfo,
			derivedPubkey: undefined as PublicKey,
			derivedAccountInfo: undefined as AccountInfo,
			derivedAccountData: "",
			pseudoId: "",
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
		groupsProgramId() {
			return new PublicKey(GROUPS_PROGRAM_ID);
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
		disconnectWallet(e: Event) {
			if (this.wallet) {
				this.wallet.disconnect().then((res: boolean) => {
					if (res) {
						this.wallet = undefined;

						pop_info("wallet disconnected");
					}
				});
			} else {
				pop_info("wallet not connected");
			}
		},
		getWalletAccountInfo(e: Event) {
			this._updateWalletInfo();
		},
		createDerivedAccount(e: Event) {
			const GROUP_SEED = "abcgroup";
			const space = 43 + 4; // plus 4 due to some data diffs between client and program

			createFromSeed(
				this.getSolanaConn,
				this.wallet,
				this.groupsProgramId,
				GROUP_SEED,
				space
			).then((pubkey: PublicKey) => {
				this.derivedPubkey = pubkey;
				this._updateWalletInfo();
				this._updateDataAccountInfo();
			});
		},
		sendGroupData(e: Event) {
			this.pseudoId = random_string(43); // 43

			saveData(
				this.getSolanaConn,
				this.wallet,
				this.derivedPubkey,
				this.groupsProgramId,
				this.pseudoId
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
			<button @click="createDerivedAccount">
				create account with seed
			</button>
			<div v-if="derivedAccountInfo">
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
			<button @click="sendGroupData">send group initial data</button>
			<div v-if="pseudoId">
				<p>
					save pseudo id:
					<strong>{{ pseudoId }}</strong>
				</p>
			</div>
		</div>
		<div>
			<button @click="disconnectWallet">disconnect wallet</button>
		</div>
	</div>
</template>

<style scoped>
.grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
}

.grid div {
	height: 200px;
}
</style>
