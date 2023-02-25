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

export const validateContent = async (content, amount, position) => {
 
    const wallet = useAnchorWallet()
    const connection = new Connection(clusterUrl, commitment)
    const provider = computed(() => new AnchorProvider(connection, wallet.value, { preflightCommitment, commitment }))
    const program = computed(() => new Program(idl, programID, provider.value))

    workspace = {
        wallet,
        connection,
        provider,
        program,
    }

    console.log("Validate Workspace: " + workspace);
    console.log("Wallet: " + workspace.wallet.value.publicKey)
    console.log("Programid: " + programID)

    //G5586cHD6dvcTmmVKxXM4YnToXTm8Eh3CzNHstN9aTyC
    const [contentPDA] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(anchor.utils.bytes.utf8.encode(content.content)), 
      content.poster.toBuffer()],
      programID
    )

    const [validatePDA] = await anchor.web3.PublicKey.findProgramAddressSync(
      [contentPDA.toBuffer(),
      workspace.wallet.value.publicKey.toBuffer()],
      programID
    )
      
    //J7XQ3r2XTGn6ryDZu3QkuZRcgi7M8RKevye48p6BC9ZA
    const [vaultPDA] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(anchor.utils.bytes.utf8.encode("vault")), 
      contentPDA.toBuffer()],
      programID
    )
      
    console.log("Vault pda: " + vaultPDA);
    console.log("Wallet: " + wallet)
    console.log("Content pda: " + contentPDA);
    console.log("Validate pda: " + validatePDA);
    console.log("cluster: " + clusterUrl)
    console.log("content: " + content.content)
    console.log("amount: " + amount)
    console.log("position: " + position)

    await program.value.methods.validateV0(new anchor.BN(amount * 1000000000), position)
        .accounts({    
          validate: validatePDA,
          validator: workspace.wallet.value.publicKey,
          vault: vaultPDA,
          poster: content.poster,
          content: contentPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        // .signers([workspace.wallet.value])
        .rpc()

        const content1 = await program.value.account.content.all();
        console.log(content1)
}