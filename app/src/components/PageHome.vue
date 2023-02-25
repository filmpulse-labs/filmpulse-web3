<script setup>
import { ref } from 'vue'
import { paginateposts } from '@/api'
import TweetForm from '@/components/TweetForm'
import TweetList from '@/components/TweetList'

const posts = ref([])
const onNewPage = newposts => posts.value.push(...newposts)
const { prefetch, hasNextPage, getNextPage, loading } = paginateposts([], 10, onNewPage)
prefetch().then(getNextPage)

const addTweet = tweet => posts.value.push(tweet)
</script>

<template>
    <tweet-form @added="addTweet"></tweet-form>
    <tweet-list v-model:posts="posts" :loading="loading" :has-more="hasNextPage" @more="getNextPage"></tweet-list>
</template>
