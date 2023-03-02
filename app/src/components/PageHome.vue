<script setup>
import { ref } from 'vue'
import { paginateposts } from '@/api'
import PostContentForm from '@/components/PostContentForm'
import PostContentList from '@/components/PostContentList'

const posts = ref([])
const onNewPage = newposts => posts.value.push(...newposts)
const { prefetch, hasNextPage, getNextPage, loading } = paginateposts([], 10, onNewPage)
prefetch().then(getNextPage)

const addPostContent = postContent => posts.value.push(postContent)
</script>

<template>
    <postContent-form @added="addPostContent"></postContent-form>
    <postContent-list v-model:posts="posts" :loading="loading" :has-more="hasNextPage" @more="getNextPage"></postContent-list>
</template>
