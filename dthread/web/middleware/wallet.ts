import { Middleware, Context } from '@nuxt/types';
import { useConnection, useWallet } from '@solana/wallet-adapter-phantom';

const myMiddleware: Middleware = (context: Context) => {
  // Use context
  console.log("wallet middleware");
}

export default myMiddleware