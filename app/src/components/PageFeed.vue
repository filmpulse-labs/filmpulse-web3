<script setup>
import { ref, watchEffect } from 'vue'
import { paginateposts } from '@/api'
import PostContentList from '@/components/PostContentList'
import { useWorkspace } from '@/composables'
import { fetchPosts } from '@/api'

const posts = ref([])
const { wallet } = useWorkspace()
const filters = ref([])

fetchPosts()
    .then(fetchedPosts => 
        posts.value = fetchedPosts) 
    .finally(() => loading.value = false)

const onNewPage = newposts => posts.value.push(...newposts)
const { prefetch, hasNextPage, getNextPage, loading } = paginateposts(filters, 20, onNewPage)

watchEffect(() => {
    if (! wallet.value) return
    posts.value = []
    prefetch().then(getNextPage)
})
</script>

<template>
    <postContent-list v-model:posts="posts" :loading="loading" :has-more="hasNextPage" @more="getNextPage"></postContent-list>
</template>