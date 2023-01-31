/* eslint-disable */
import { useWorkspace, usePagination } from '@/composables'
import { Tweet } from '@/models'
import bs58 from 'bs58'
import { BN } from '@project-serum/anchor'
import { computed, ref } from 'vue'
import * as anchor from "@project-serum/anchor";
import { useAnchorWallet } from 'solana-wallets-vue'
import { Connection, PublicKey } from '@solana/web3.js'
import { AnchorProvider, Program } from '@project-serum/anchor'
import idl from '@/idl/gopulse.json'

export const fetchTweets = async (filters = []) => {
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

   
    const tweets = await program.value.account.content.all();
    return tweets.map(tweet => new Tweet(tweet.publicKey, tweet.account))
}

export const paginateTweets = (filters = [], perPage = 6, onNewPage = () => {}) => {
    
    filters = ref(filters)
    const { program, connection } = useWorkspace()
    const page = ref(0)

    const prefetchCb = async () => {
        // Reset page number.
        page.value = 0

        // Prepare the discriminator filter.
        const tweetClient = program.value.account.content
        const tweetAccountName = tweetClient._idlAccount.name
        const tweetDiscriminatorFilter = {
            memcmp: tweetClient.coder.accounts.memcmp(tweetAccountName)
        }

        // Prefetch all tweets with their timestamps only.
        const allTweets = await connection.getProgramAccounts(program.value.programId, {
            filters: [tweetDiscriminatorFilter, ...filters.value],
            dataSlice: { offset: 40, length: 8 },
        })

        // Parse the timestamp from the account's data.
        const allTweetsWithTimestamps = allTweets.map(({ account, pubkey }) => ({
            pubkey,
            timestamp: new BN(account.data, 'le'),
        }))

        return allTweetsWithTimestamps
            .sort((a, b) => b.timestamp.cmp(a.timestamp))
            .map(({ pubkey }) => pubkey)
    }

    const pageCb = async (page, paginatedPublicKeys) => {
        const tweets = await program.value.account.content.fetchMultiple(paginatedPublicKeys)

        return tweets.reduce((accumulator, tweet, index) => {
            const publicKey = paginatedPublicKeys[index]
            accumulator.push(new Tweet(publicKey, tweet))
            return accumulator
        }, [])
    }

    const pagination = usePagination(perPage, prefetchCb, pageCb)
    const { hasPage, getPage } = pagination

    const hasNextPage = computed(() => hasPage(page.value + 1))
    const getNextPage = async () => {
        const newPageTweets = await getPage(page.value + 1)
        page.value += 1
        onNewPage(newPageTweets)
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
