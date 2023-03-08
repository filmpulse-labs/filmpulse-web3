<script setup>
import { ref, watchEffect } from 'vue'
import { paginateposts, authorFilter } from '@/api'
import PostContentForm from '@/components/PostContentForm'
import PostContentList from '@/components/PostContentList'
import PageUserForm from '@/components/PageUserForm'
import { useWorkspace } from '@/composables'

const posts = ref([])
const { wallet } = useWorkspace()
const filters = ref([])
let update = ref(false)

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
        {{ wallet.publicKey.toBase58() }}
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