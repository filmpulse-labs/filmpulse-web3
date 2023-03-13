<script setup>
import { ref, watchEffect } from 'vue'
import { fetchvalidatedposts, paginateposts } from '@/api'
import PostContentList from '@/components/ValidatedPostContentList'
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

</script>

<template>
    <postContent-list v-model:posts="posts" :loading="loading" :has-more="hasNextPage" @more="getNextPage"></postContent-list>
</template>