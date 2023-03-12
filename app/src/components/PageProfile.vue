<script setup>
import { ref, watchEffect } from 'vue'
import { paginateposts, authorFilter, fetchUser } from '@/api'
import PostContentForm from '@/components/PostContentForm'
import PostContentList from '@/components/PostContentList'
import PageUserForm from '@/components/PageUserForm'
import { useWorkspace } from '@/composables'

const posts = ref([])
const { wallet } = useWorkspace()
const filters = ref([])
let update = ref(false)
let username = ref()
let useravatar = ref()

fetchUser(wallet.value.publicKey).then(res => {
    username.value = res.name
    useravatar.value = res.avatar
})

const onNewPage = newposts => posts.value.push(...newposts)
const { prefetch, hasNextPage, getNextPage, loading } = paginateposts(filters, 10, onNewPage)

watchEffect(() => {
    if (! wallet.value) return
    posts.value = []
    filters.value = [authorFilter(wallet.value.publicKey.toBase58())]
    prefetch().then(getNextPage)
})

const addPostContent = postContent => posts.value.push(postContent)

function toggleSettings() {
    update.value = !update.value
}

</script>

<template>
    <div v-if="wallet" class="border-b px-8 py-4 bg-gray-500 break-all">
        <span>
            <img style="border-radius: 50%; max-height: 100px; max-width: 100px" v-bind:src=this.useravatar>
            <h1 style="font-size: 24px;">{{ this.username }}</h1>
        </span>
        <h5 style="font-size: 14px;">{{ wallet.publicKey.toBase58() }}</h5>
        <div class="flex items-center space-x-6 m-2 ml-auto">
    <button
        class="text-white bg-blue-800 px-4 py-2 rounded-full font-semibold"
        @click="toggleSettings"
    >
        Settings
    </button>
    </div>
    </div>
    <pageUser-form v-if="update"></pageUser-form>
    <postContent-form @added="addPostContent"></postContent-form>
    <postContent-list v-model:posts="posts" :loading="loading" :has-more="hasNextPage" @more="getNextPage"></postContent-list>
</template>

<!-- <script setup>
import { ref, watchEffect } from 'vue'
import { paginateposts, authorFilter, fetchUser } from '@/api'
import PostContentForm from '@/components/PostContentForm'
import PostContentList from '@/components/PostContentList'
import PageUserForm from '@/components/PageUserForm'
import { useWorkspace } from '@/composables'
import { useAnchorWallet } from 'solana-wallets-vue'

const posts = ref([])
// const { wallet } = useWorkspace()
const wallet = useAnchorWallet()
const filters = ref([])
let update = ref(false)
let username = ref()
let useravatar = ref()

const onNewPage = newposts => posts.value.push(...newposts)
const { prefetch, hasNextPage, getNextPage, loading } = paginateposts(filters, 10, onNewPage)

console.log("wallet profile: " + wallet.value.publicKey)

watchEffect(() => {
    if (! wallet.value) return
    posts.value = []
    filters.value = [authorFilter(wallet.value.publicKey.toBase58())]
    prefetch().then(getNextPage)
})

fetchUser(wallet.value.publicKey).then(res => {
    username.value = res.name
    useravatar.value = res.avatar
})

const addPostContent = postContent => posts.value.push(postContent)

function toggleSettings() {
    update.value = !update.value
}

</script>

<template>
    <div v-if="wallet" class="border-b px-8 py-4 bg-gray-500 break-all">
        <span>
            <img style="border-radius: 50%; max-height: 100px; max-width: 100px" v-bind:src=this.useravatar>
            <h1 style="font-size: 24px;">{{ this.username }}</h1>
        </span>
        <h5 style="font-size: 14px;">{{ wallet.publicKey.toBase58() }}</h5>
        <div class="flex items-center space-x-6 m-2 ml-auto">
    <button
        class="text-white bg-blue-800 px-4 py-2 rounded-full font-semibold"
        @click="toggleSettings"
    >
        Settings
    </button>
    </div>
    </div>
    <pageUser-form v-if="update"></pageUser-form>
    <postContent-form @added="addPostContent"></postContent-form>
    <postContent-list v-model:posts="posts" :loading="loading" :has-more="hasNextPage" @more="getNextPage"></postContent-list>
</template> -->