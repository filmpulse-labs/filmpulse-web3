/* eslint-disable */
import { useWorkspace, usePagination } from '@/composables'
import { PostContent, Validator } from '@/models'
import bs58 from 'bs58'
import { BN } from '@project-serum/anchor'
import { computed, ref } from 'vue'
import * as anchor from "@project-serum/anchor";
import { useAnchorWallet } from 'solana-wallets-vue'
import { Connection, PublicKey } from '@solana/web3.js'
import { AnchorProvider, Program } from '@project-serum/anchor'
import idl from '@/idl/gopulse.json'

export const fetchvalidated = async (filters = []) => {
    const clusterUrl = process.env.VUE_APP_CLUSTER_URL
    const preflightCommitment = 'processed'
    const commitment = 'processed'
    const programID = new PublicKey(idl.metadata.address)
    let workspace = null
    const wallet = useAnchorWallet()
    const connection = new Connection(clusterUrl, commitment)
    const provider = computed(() => new AnchorProvider(connection, wallet.value, { preflightCommitment, commitment }))
    const program = computed(() => new Program(idl, programID, provider.value))

   
    const validate = await program.value.account.validate.all();
    return validate.map(validateContent => new Validator(validateContent.publicKey, validateContent.account))
}