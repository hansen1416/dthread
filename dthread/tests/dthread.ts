import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Dthread } from '../target/types/dthread';

describe('dthread', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Dthread as Program<Dthread>;

  it('Is initialized!', async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});
