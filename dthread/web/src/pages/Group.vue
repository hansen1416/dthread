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
import { pop_info, sleep } from "../helpers/index";
import { GROUPS_PROGRAM_ID } from "../constants/index";
import { createFromSeed } from "../solana/account";
import { saveData } from "../solana/data";
import arweaveService from "../arweave/index";
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
		derivedAccountData: string;
		groupData: string;
		ArweaveId: string;
		readDataProcess: string;
		groupName: string;
	} {
		return {
			solanaConn: undefined as Connection,
			wallet: undefined as PhantomWallet,
			walletAccountInfo: undefined as AccountInfo,
			derivedPubkey: undefined as PublicKey,
			derivedAccountInfo: undefined as AccountInfo,
			derivedAccountData: "",
			groupData:
				'{"group_name":"ABC group","created_at":"2022-01-11 00:00:00","active":true,"sub_forums":[{"name":"Sub forum one"},{"name":"Sub forum two"},{"name":"Sub forum three"}]}',
			ArweaveId: "",
			readDataProcess: "",
			groupName: "abcgroup",
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
		// console.log(arweaveService);
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
		saveToArweave(e: Event) {
			const ars = arweaveService;

			const buf = Buffer.from(this.groupData, "utf8");

			(async () => {
				this.ArweaveId = await ars.saveData(buf);
			})();
		},
		createDerivedAccount(e: Event) {
			const space = 43 + 4; // plus 4 due to some data diffs between client and program

			(async () => {
				if (this.wallet == undefined) {
					this.wallet = new PhantomWallet();

					await this.wallet.connect();
				}

				createFromSeed(
					this.getSolanaConn,
					this.wallet,
					this.groupsProgramId,
					this.groupName,
					space
				).then((pubkey: PublicKey) => {
					this.derivedPubkey = pubkey;
					this._updateWalletInfo();
					this._updateDataAccountInfo();
				});
			})();
		},
		sendGroupData(e: Event) {
			saveData(
				this.getSolanaConn,
				this.wallet,
				this.derivedPubkey,
				this.groupsProgramId,
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
		readFromArweave() {
			const ars = arweaveService;

			this.readDataProcess =
				"<p>star reading from <strong>" +
				this.derivedPubkey +
				" </strong></p>";
			(async () => {
				const accinfo = await this.getSolanaConn.getAccountInfo(
					this.derivedPubkey
				);

				const dacc: DataAccount = borsh.deserialize(
					DataSchema,
					DataAccount,
					accinfo.data
				);

				const aid = dacc.id;

				sleep(200);

				this.readDataProcess +=
					"<p>find Arweave id <strong>" + aid + " </strong></p>";

				this.readDataProcess += "<p>start reading from Arweave </p>";
				const adata = new DataAccount();
				adata.id = aid;
				const res = await ars.getData(adata);

				sleep(200);

				this.readDataProcess +=
					"<p>get group data from Arweave <strong>" +
					res +
					" </strong></p>";
			})();
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
			<button @click="saveToArweave">save to arweave</button>
			<div>
				<p>
					Group structure info: <strong>{{ groupData }}</strong>
				</p>
				<p v-if="ArweaveId">{{ ArweaveId }}</p>
			</div>
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
			<button @click="sendGroupData">send group initial data</button>
			<div v-if="ArweaveId">
				<p>
					save Arweave id:
					<strong>{{ ArweaveId }}</strong>
				</p>
			</div>
		</div>
		<div>
			<button @click="readFromArweave">
				read group data from solana => arweave
			</button>
			<div v-if="readDataProcess" v-html="readDataProcess"></div>
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
