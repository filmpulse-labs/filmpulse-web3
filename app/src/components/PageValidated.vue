<script setup>
import { ref, watchEffect } from 'vue'
import { fetchvalidated, paginateposts, authorFilter } from '@/api'
import PostContentList from '@/components/PostContentList'
import { useWorkspace } from '@/composables'
import { PostContent } from '@/models'


const posts = ref([])
const { wallet, program } = useWorkspace()
const filters = ref([])
let validatedPosts = []
let validPosts = []

function fetchValidPost(posts) {
    console.log(posts)
    return posts.map(postContent => new PostContent(postContent.pub, postContent.post))
}

fetchvalidated().then(async (srs) => {
    for (let index = 0; index < srs.length; index++) {
        const element = srs[index];
        if (element.validator.toBase58() == wallet.value.publicKey.toBase58()) {
            let pub = element.content 
            const post = await program.value.account.content.fetch(pub);
            console.log(post)
            validatedPosts.push({pub, post}) 
        }
    }
    console.log("posts: " + validatedPosts)
    fetchValidPost(validatedPosts)
    console.log("vposts: " + validPosts)
})

const onNewPage = newposts => posts.value.push(...newposts)
const { prefetch, hasNextPage, getNextPage, loading } = paginateposts(filters, 10, onNewPage)

watchEffect(() => {
    if (! wallet.value) return
    posts.value = []
    // filters.value = [authorFilter(wallet.value.publicKey.toBase58())]
    prefetch().then(getNextPage)
})
</script>

<template>
    <div v-if="wallet" class="border-b px-8 py-4 bg-gray-500 break-all">
        {{ wallet.publicKey.toBase58() }}
    </div>
    <postContent-list v-model:posts="posts" :loading="loading" :has-more="hasNextPage" @more="getNextPage"></postContent-list>
</template>