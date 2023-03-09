<script setup>
import { ref } from 'vue'
import { paginateposts } from '@/api'
import PostContentList from '@/components/PostContentList'

const posts = ref([])

const onNewPage = newposts => posts.value.push(...newposts)
const { prefetch, hasNextPage, getNextPage, loading } = paginateposts([], 10, onNewPage)
prefetch().then(getNextPage)

</script>

<template>
    <postContent-list v-model:posts="posts" :loading="loading" :has-more="hasNextPage" @more="getNextPage"></postContent-list>
</template>
