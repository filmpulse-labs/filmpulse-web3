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

export const createUser = async (name, avatar) => {
 
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

    console.log(wallet.value.publicKey)
    console.log(workspace.wallet.value.publicKey)
     
    const [profilePDA] = await anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from(anchor.utils.bytes.utf8.encode("profile")), 
        workspace.wallet.value.publicKey.toBuffer()],
        programID
    )

    console.log(profilePDA.toString())

    await program.value.methods.signupUserV0(name, avatar)
        .accounts({    
            authority: workspace.wallet.value.publicKey,
            userAccount: profilePDA,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc()

    const userstate = await program.value.account.userState.fetch(profilePDA)
    console.log(userstate)
}

export const updateUser = async (name, avatar) => {
 
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

    console.log(wallet.value.publicKey)
    console.log(workspace.wallet.value.publicKey)
     
    const [profilePDA] = await anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from(anchor.utils.bytes.utf8.encode("profile")), 
        workspace.wallet.value.publicKey.toBuffer()],
        programID
    )

    console.log(profilePDA.toString())

    await program.value.methods.updateUserV0(name, avatar)
        .accounts({    
            authority: workspace.wallet.value.publicKey,
            userAccount: profilePDA,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc()

    const userstate = await program.value.account.userState.fetch(profilePDA)
    console.log(userstate)
}

export const fetchUser = (userKey) => {
 
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

    console.log("userkey: " + userKey)

    const [profilePDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from(anchor.utils.bytes.utf8.encode("profile")), 
        userKey.toBuffer()],
        programID
    )

    const userstate = program.value.account.userState.fetch(profilePDA)
    return userstate
}