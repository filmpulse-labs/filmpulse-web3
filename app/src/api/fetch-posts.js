/* eslint-disable */
import { useWorkspace, usePagination } from '@/composables'
import { PostContent } from '@/models'
import bs58 from 'bs58'
import { BN } from '@project-serum/anchor'
import { computed, ref } from 'vue'
import * as anchor from "@project-serum/anchor";
import { useAnchorWallet } from 'solana-wallets-vue'
import { Connection, PublicKey } from '@solana/web3.js'
import { AnchorProvider, Program } from '@project-serum/anchor'
import idl from '@/idl/gopulse.json'

export const fetchposts = async (filters = []) => {
    const clusterUrl = process.env.VUE_APP_CLUSTER_URL
    const preflightCommitment = 'processed'
    const commitment = 'processed'
    const programID = new PublicKey(idl.metadata.address)
    console.log("ProgramID: " + programID)
    let workspace = null
    const wallet = useAnchorWallet()
    const connection = new Connection(clusterUrl, commitment)
    const provider = computed(() => new AnchorProvider(connection, wallet.value, { preflightCommitment, commitment }))
    const program = computed(() => new Program(idl, programID, provider.value))

   
    const posts = await program.value.account.content.all();
    return posts.map(postContent => new PostContent(postContent.publicKey, postContent.account))
}

export const paginateposts = (filters = [], perPage = 6, onNewPage = () => {}) => {
    
    filters = ref(filters)
    const { program, connection } = useWorkspace()
    const page = ref(0)

    const prefetchCb = async () => {
        // Reset page number.
        page.value = 0

        // Prepare the discriminator filter.
        const postContentClient = program.value.account.content
        const postContentAccountName = postContentClient._idlAccount.name
        const postContentDiscriminatorFilter = {
            memcmp: postContentClient.coder.accounts.memcmp(postContentAccountName)
        }

        // Prefetch all posts with their timestamps only.
        const allposts = await connection.getProgramAccounts(program.value.programId, {
            filters: [postContentDiscriminatorFilter, ...filters.value],
            dataSlice: { offset: 40, length: 8 },
        })

        // Parse the timestamp from the account's data.
        const allpostsWithTimestamps = allposts.map(({ account, pubkey }) => ({
            pubkey,
            timestamp: new BN(account.data, 'le'),
        }))

        return allpostsWithTimestamps
            .sort((a, b) => b.timestamp.cmp(a.timestamp))
            .map(({ pubkey }) => pubkey)
    }

    const pageCb = async (page, paginatedPublicKeys) => {
        const posts = await program.value.account.content.fetchMultiple(paginatedPublicKeys)

        return posts.reduce((accumulator, postContent, index) => {
            const publicKey = paginatedPublicKeys[index]
            accumulator.push(new PostContent(publicKey, postContent))
            return accumulator
        }, [])
    }

    const pagination = usePagination(perPage, prefetchCb, pageCb)
    const { hasPage, getPage } = pagination

    const hasNextPage = computed(() => hasPage(page.value + 1))
    const getNextPage = async () => {
        const newPageposts = await getPage(page.value + 1)
        page.value += 1
        onNewPage(newPageposts)
    }

    return { page, hasNextPage, getNextPage, ...pagination }
}

export const authorFilter = authorBase58PublicKey => ({
    memcmp: {
        offset: 8, // Discriminator.
        bytes: authorBase58PublicKey,
    }
})

export const topicFilter = topic => ({
    memcmp: {
        offset: 8 + // Discriminator.
            32 + // Author public key.
            8 + // Timestamp.
            4, // Topic string prefix.
        bytes: bs58.encode(Buffer.from(topic)),
    }
})
