<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchUser, paginateposts, authorFilter } from '@/api'
import { useFromRoute } from '@/composables'
import PostContentList from '@/components/PostContentList'
import PostSearch from '@/components/PostSearch'
import { PublicKey } from '@solana/web3.js'

// Data.
const router = useRouter()
const posts = ref([])
const author = ref('')
const viewedAuthor = ref('')
const filters = ref([])
let username = ref('')
let authority = ref('')
let useravatar = ref('')

const onNewPage = newposts => posts.value.push(...newposts)
const { prefetch, hasNextPage, getNextPage, loading } = paginateposts(filters, 10, onNewPage)

// Actions.
const search = () => {
    router.push(`/users/${author.value}`)
}

const fetchAuthorposts = () => {
    if (author.value === viewedAuthor.value) return;
    posts.value = []
    viewedAuthor.value = author.value
    filters.value = [authorFilter(author.value)]
    prefetch().then(getNextPage)
}

// Router hooks.
useFromRoute((route) => {
    author.value = route.params.author
    if (author.value) {
        fetchAuthorposts()
    } else {
        posts.value = []
        viewedAuthor.value = ''
    }
})

try {
    console.log(author.value)
    const publicKey = new PublicKey(author.value)
    fetchUser(publicKey).then(res => {
        console.log(res)
        username.value = res.name
        useravatar.value = res.avatar
        authority.value = res.authority
    })
} catch (error) {
    console.log(error)
}
</script>

<template>
    <post-search placeholder="public key" :disabled="!author" v-model="author" @search="search">
        <template #icon>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
        </template>
    </post-search>
    <div v-if="viewedAuthor" class="border-b px-8 py-4 bg-gray-500 break-all" style="display: flex; align-items: center;">
        <img style="border-radius: 50%; max-height: 100px; max-width: 100px; margin-right: 16px; object-fit: cover; aspect-ratio: 1/1;" :src="useravatar" alt="User Avatar">
    <div>
        <h1 style="font-size: 24px; margin-bottom: 8px;">{{ username }}</h1>
        <h5 style="font-size: 14px;">{{ authority }}</h5>
    </div>
</div>

    <div v-if="viewedAuthor">
        <postContent-list v-model:posts="posts" :loading="loading" :has-more="hasNextPage" @more="getNextPage"></postContent-list>
        <div v-if="!loading && posts.length === 0" class="p-8 text-gray-500 text-center">
            User not found...
        </div>
    </div>
</template>