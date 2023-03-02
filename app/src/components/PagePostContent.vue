<script setup>
import { ref, watchEffect } from 'vue'
import { PublicKey } from '@solana/web3.js'
import { getPostContent } from '@/api'
import { useFromRoute } from '@/composables'
import PostContentCard from '@/components/PostContentCard'

const postContentAddress = ref(null)
useFromRoute((route) => postContentAddress.value = route.params.postContent)

const loading = ref(false)
const postContent = ref(null)
watchEffect(async () => {
    try {
        loading.value = true
        postContent.value = await getPostContent(new PublicKey(postContentAddress.value))
    } catch (e) {
        postContent.value = null
    } finally {
        loading.value = false
    }
})
</script>

<template>
    <div v-if="loading" class="p-8 text-gray-500 text-center">
        Loading...
    </div>
    <div v-else-if="! postContent" class="p-8 text-gray-500 text-center">
        PostContent not found
    </div>
    <postContent-card v-else :postContent="postContent" @delete="$router.push({ name: 'Home' })"></postContent-card>
</template>
