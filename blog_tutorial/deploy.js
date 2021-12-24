import spawn from 'cross-spawn';

import fs from "fs";
import path  from "path";
import { dirname } from "path";
import {fileURLToPath} from "url";

import {Keypair, Connection, LAMPORTS_PER_SOL} from '@solana/web3.js';

const SLASH=path.sep;

const projectName = 'blog_tutorial';

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const programAuthorityKeyfilename = 'deploy/programauthority-keypair.json';
const programAuthorityKeypairFile = path.resolve(
    `${__dirname}${SLASH}${programAuthorityKeyfilename}`
)

const programKeyfileName = `target/deploy/${projectName}-keypair.json`
const programKeypairFile = path.resolve(
    `${__dirname}${SLASH}${programKeyfileName}`
)

const connection = new Connection(
    "https://api.devnet.solana.com", "confirmed"
)

function readKeyfile(keypairfile) {
    let kf = fs.readFileSync(keypairfile)
    let parsed = JSON.parse(kf.toString()) // [1,1,2,2,3,4]
    kf = new Uint8Array(parsed)
    const keypair = Keypair.fromSecretKey(kf)
    return keypair
}


(async() => {

    let method
    let programAuthorityKeypair
    let programId
    let programKeypair

    programKeypair = readKeyfile(programKeypairFile)
    console.log({ publicKey: programKeypair.publicKey })
    programId = programKeypair.publicKey.toString()

    if (!fs.existsSync(programAuthorityKeypairFile)) {
        // doesn't exist create it
        // use this to deploy

        spawn.sync("anchor", ["build"], {stdio: "inherit"});

        let programAuthorityKeypair = new Keypair();

        let signature = await connection.requestAirdrop(programAuthorityKeypair.publicKey , LAMPORTS_PER_SOL*2);

        await connection.confirmTransaction(signature);

        console.log(`\n\n Created keypair. \n`);
        console.log(`\n\n Saving keypair. ${programAuthorityKeypairFile}\n`);
        console.log(`\n\n Keypair pubkey. ${programAuthorityKeypairFile.publicKey}\n`);

        fs.writeFileSync(
            programAuthorityKeypairFile,
            `[${Buffer.from(
                programAuthorityKeypair.secretKey.toString()
            )}]`
        )

        method=["deploy"]

    }else{
        // does exist, use it to upgrade

        programAuthorityKeypair = readKeyfile(programAuthorityKeypairFile)

        console.log(`\n\n\⚙️ Upgrading program.\n`)

        method = [
            "upgrade",
            `target/deploy/${projectName}.so`,
            "--program-id",
            programId,
        ]

    }

    console.log({ method })
    spawn.sync(
        "anchor",
        [
            ...method,
            "--provider.cluster",
            "Devnet",
            "--provider.wallet",
            `${programAuthorityKeypairFile}`,
        ],
        {stdio: "inherit"}
    )

    // fs.copyFile(
    //     `target/idl/${projectName}.json`,
    //     `app/src/lib/idl/${projectName}.json`,
    //     (err) => {
    //         if (err) throw err
    //         console.log(`${projectName}.json was copied to ./app`)
    //     }
    // )

})();