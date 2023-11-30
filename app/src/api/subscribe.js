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

export async function subscribing(subscribed) {

    const wallet = useAnchorWallet();
    const connection = new Connection(clusterUrl, commitment);
    const provider = computed(() => new AnchorProvider(connection, wallet.value, { preflightCommitment, commitment }));
    const program = computed(() => new Program(idl, programID, provider.value));

    workspace = {
        wallet,
        connection,
        provider,
        program,
    };

    const [subscribePDA] = await anchor.web3.PublicKey.findProgramAddressSync(
        [workspace.wallet.value.publicKey.toBuffer(),
        subscribed.toBuffer()],
        programID
    );

    console.log("subscribe pda: " + subscribePDA);

    await program.value.methods.subscribeV0()
        .accounts({
            subscribeAccount: subscribePDA,
            subscriber: workspace.wallet.value.publicKey,
            subscribed: subscribed,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

    const content1 = await program.value.account.subscribeState.fetch(subscribePDA);
    console.log(content1);
}

export async function isSubscribed(subscribed) {

    const wallet = useAnchorWallet();
    const connection = new Connection(clusterUrl, commitment);
    const provider = computed(() => new AnchorProvider(connection, wallet.value, { preflightCommitment, commitment }));
    const program = computed(() => new Program(idl, programID, provider.value));

    workspace = {
        wallet,
        connection,
        provider,
        program,
    };

    const [subscribePDA] = await anchor.web3.PublicKey.findProgramAddressSync(
        [workspace.wallet.value.publicKey.toBuffer(),
        subscribed.toBuffer()],
        programID
    );

    console.log("subscribe pda: " + subscribePDA);

    const subbed = await program.value.account.subscribeState.fetch(subscribePDA);
    console.log(subbed);
}