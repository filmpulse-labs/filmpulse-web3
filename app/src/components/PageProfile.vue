<script setup>
import { ref, watchEffect } from 'vue'
import { paginateposts, authorFilter } from '@/api'
import PostContentForm from '@/components/PostContentForm'
import PostContentList from '@/components/PostContentList'
import { useWorkspace } from '@/composables'

const posts = ref([])
const { wallet } = useWorkspace()
const filters = ref([])

const onNewPage = newposts => posts.value.push(...newposts)
const { prefetch, hasNextPage, getNextPage, loading } = paginateposts(filters, 10, onNewPage)

watchEffect(() => {
    if (! wallet.value) return
    posts.value = []
    filters.value = [authorFilter(wallet.value.publicKey.toBase58())]
    prefetch().then(getNextPage)
})

const addPostContent = postContent => posts.value.push(postContent)
</script>

<template>
    <div v-if="wallet" class="border-b px-8 py-4 bg-gray-500 break-all">
        {{ wallet.publicKey.toBase58() }}
    </div>
    <postContent-form @added="addPostContent"></postContent-form>
    <postContent-list v-model:posts="posts" :loading="loading" :has-more="hasNextPage" @more="getNextPage"></postContent-list>
</template>
