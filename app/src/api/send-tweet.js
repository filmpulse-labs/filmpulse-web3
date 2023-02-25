/* eslint-disable */
import { Tweet } from '@/models'
import * as anchor from "@project-serum/anchor";
import { computed } from 'vue'
import { useAnchorWallet } from 'solana-wallets-vue'
import { Connection, PublicKey } from '@solana/web3.js'
import { AnchorProvider, Program } from '@project-serum/anchor'
import idl from '@/idl/gopulse.json'

const clusterUrl = process.env.VUE_APP_CLUSTER_URL
const preflightCommitment = 'processed'
const commitment = 'processed'
const programID = new PublicKey(idl.metadata.address)
console.log("ProgramID: " + programID)
let workspace = null

export const sendTweet = async (content, topic, amount, threshold) => {
 
    const wallet = useAnchorWallet()
    const connection = new Connection(clusterUrl, commitment)
    const provider = computed(() => new AnchorProvider(connection, wallet.value, { preflightCommitment, commitment }))
    const program = computed(() => new Program(idl, programID, provider.value))

    const posts = await program.value.account.content.all();
    console.log(posts)

    workspace = {
        wallet,
        connection,
        provider,
        program,
    }

    console.log("Send Post workspace: " + workspace);
    console.log("Wallet: " + workspace.wallet.value.publicKey)
    console.log("Programid: " + programID)
    console.log("slice: " + content.slice(0, 10))

    const [contentPDA] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(anchor.utils.bytes.utf8.encode(content.slice(0, 10))), 
      workspace.wallet.value.publicKey.toBuffer()],
      programID
    )
      
    const [vaultPDA] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(anchor.utils.bytes.utf8.encode("vault")), 
      contentPDA.toBuffer()],
      programID
    )
      
    console.log("Vault pda: " + vaultPDA);
    console.log("Wallet: " + wallet)
    console.log("Content pda: " + contentPDA);
    console.log("cluster: " + clusterUrl)
    console.log(content, topic, amount, threshold)

    await program.value.methods.postV0(content, topic, new anchor.BN(amount * 1000000000), new anchor.BN(threshold))
        .accounts({    
            content: contentPDA,
            poster: workspace.wallet.value.publicKey,
            vault: vaultPDA,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc()

        const content1 = await program.value.account.content.fetch(contentPDA);
        console.log(content1)
}