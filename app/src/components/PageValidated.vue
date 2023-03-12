<script setup>
import { ref, watchEffect } from 'vue'
import { fetchvalidatedposts, paginateposts } from '@/api'
import PostContentList from '@/components/PostContentList'
import { useWorkspace } from '@/composables'

const posts = ref([])
const { wallet } = useWorkspace()
const filters = ref([])

fetchvalidatedposts()

const onNewPage = newposts => posts.value.push(...newposts)
const { prefetch, hasNextPage, getNextPage, loading } = paginateposts(filters, 20, onNewPage)

watchEffect(() => {
    if (! wallet.value) return
    posts.value = []
    prefetch().then(getNextPage)
})
console.log(posts.value.values())
</script>

<template>
    <div v-if="wallet" class="border-b px-8 py-4 bg-gray-500 break-all">
        {{ wallet.publicKey.toBase58() }}
    </div>
    <postContent-list v-model:posts="posts" :loading="loading" :has-more="hasNextPage" @more="getNextPage"></postContent-list>
</template>