/* eslint-disable */
import { PostContent } from '@/models'
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
let workspace = null

export const posterCollect = async (counter) => {
 
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

    const [contentPDA] = await anchor.web3.PublicKey.findProgramAddressSync(
        [new anchor.BN(counter).toArrayLike(Buffer, "le", 8), 
          workspace.wallet.value.publicKey.toBuffer()],
          programID
        )
      
    const [vaultPDA] = await anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from(anchor.utils.bytes.utf8.encode("vault")), 
        contentPDA.toBuffer()],
        programID
    )

    console.log("content pda: " + contentPDA)
    console.log("vault pda: " + vaultPDA)
      
    await program.value.methods.posterCollectV0()
        .accounts({   
          poster: workspace.wallet.value.publicKey,
          vault: vaultPDA,
          content: contentPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc()

    const content1 = await program.value.account.content.fetch(contentPDA);
    console.log(content1)
}

export const validatorCollect = async (poster, counter) => {
 
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

    const [contentPDA] = await anchor.web3.PublicKey.findProgramAddressSync(
        [new anchor.BN(counter).toArrayLike(Buffer, "le", 8), 
          poster.toBuffer()],
          programID
        )
      
    const [vaultPDA] = await anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from(anchor.utils.bytes.utf8.encode("vault")), 
        contentPDA.toBuffer()],
        programID
    )

    const [validatePDA] = await anchor.web3.PublicKey.findProgramAddressSync(
        [contentPDA.toBuffer(),
        workspace.wallet.value.publicKey.toBuffer()],
        programID
      )

    console.log("content pda: " + contentPDA)
    console.log("vault pda: " + vaultPDA)
    console.log("validate pda: " + validatePDA)
      
    await program.value.methods.validatorCollectV0()
        .accounts({   
          validate: validatePDA,
          validator: workspace.wallet.value.publicKey,
          vault: vaultPDA,
          content: contentPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc()

    const content1 = await program.value.account.content.fetch(contentPDA);
    console.log(content1)  
        
    const validate1 = await program.value.account.validate.fetch(validatePDA);
    console.log(validate1)
}