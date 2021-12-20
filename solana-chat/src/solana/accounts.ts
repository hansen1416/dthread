import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { programId } from "./program";
import {
  setPayerAndBlockhashTransaction,
  signAndSendTransaction,
  WalletAdapter,
} from "./wallet";

// create a chat message account
export async function getChatMessageAccountPubkey(
  connection: Connection,
  wallet: WalletAdapter,
  space: number,
  reset: boolean = false
): Promise<PublicKey> {
  if (!wallet.publicKey) {
    throw Error("Wallet has no PublicKey");
  }
  let chatAccountPubkey: PublicKey | null = null;
  if (!reset) {
    const existingPubkeyStr = localStorage.getItem(
      wallet.publicKey.toBase58() ?? ""
    );
    if (existingPubkeyStr) {
      chatAccountPubkey = new PublicKey(existingPubkeyStr);
      console.log("chat account found");
      return chatAccountPubkey;
    }
  }
  console.log("start creating new chat account");
  const CHAT_SEED = "chat" + Math.random().toString();
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
  chatAccountPubkey = await PublicKey.createWithSeed(
    wallet.publicKey,
    CHAT_SEED,
    programId
  );
  console.log("new chat account pubkey", chatAccountPubkey.toBase58());
  const lamports = await connection.getMinimumBalanceForRentExemption(space);
  // !!! when we have a pubkey associate user's pubkey, program, and groupname, 
  // we create a account by this pubkey,
  // the source code is at `CreateAccountWithSeedParams` in web3js
  // basePubkey: Base public key to use to derive the address of the created account. Must be the same as the base key used to create newAccountPubkey
  // fromPubkey: The account that will transfer lamports to the created account
  // newAccountPubkey: the pub address derived from user's pubkey, programid and seed
  // lamports:
  // programId:
  // seed: Seed to use to derive the address of the created account. Must be the same as the seed used to create newAccountPubkey
  // spae: Amount of space in bytes to allocate to the created account, the space is immutable, and cost money
  const instruction = SystemProgram.createAccountWithSeed({
    fromPubkey: wallet.publicKey,
    basePubkey: wallet.publicKey,
    seed: CHAT_SEED,
    newAccountPubkey: chatAccountPubkey,
    lamports,
    space,
    programId,
  });
  // !!! the following steps are 3 procedures in a transaction.
  // set a transaction, sign a transaction, confirm a transaction
  let trans = await setPayerAndBlockhashTransaction(wallet, instruction);
  console.log("setPayerAndBlockhashTransaction", trans);
  let signature = await signAndSendTransaction(wallet, trans);
  console.log("signAndSendTransaction", signature);
  let result = await connection.confirmTransaction(signature, "singleGossip");
  console.log("new chat account created", result);
  // use wallet pubket as localstorage item key,
  // item value is the chat account pubkey, 
  // chat account pubkey can be get by createWithSeed(wallet.publicKey,CHAT_SEED,programId)
  localStorage.setItem(
    wallet.publicKey.toBase58(),
    chatAccountPubkey.toBase58()
  );
  return chatAccountPubkey;
}
