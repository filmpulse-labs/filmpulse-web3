<script setup>
import { ref, toRefs, computed } from 'vue'
import { useWorkspace } from '@/composables'
// import { deleteTweet } from '@/api'
import TweetFormUpdate from './TweetFormUpdate'
import TweetFormUpdate1 from './TweetFormUpdate1'

// const emit = defineEmits(['delete']);
const props = defineProps({
    tweet: Object,
})

const { tweet } = toRefs(props)
const { wallet } = useWorkspace()
const isMyTweet = computed(() => wallet.value && wallet.value.publicKey.toBase58() === tweet.value.poster.toBase58())
const authorRoute = computed(() => {
    if (isMyTweet.value) {
        return { name: 'Profile' }
    } else {
        return { name: 'Users', params: { author: tweet.value.poster.toBase58() } }
    }
})

const mayGoLong = ref(false)
const mayGoShort = ref(false)

</script>

<template>

    <tweet-form-update v-if="mayGoLong" :tweet="tweet" @close="mayGoLong = false"></tweet-form-update>
    <tweet-form-update1 v-if="mayGoShort" :tweet="tweet" @close="mayGoShort = false"></tweet-form-update1>
    <div class="px-8 py-4" v-else>
        <div class="flex justify-between">
            <div class="py-1">
                <h3 class="inline font-semibold" :title="tweet.author">
                    <router-link :to="authorRoute" class="hover:underline">
                        {{ tweet.author_display }}
                    </router-link>
                </h3>
                <span class="text-gray-500"> • </span>
                <time class="text-gray-500 text-sm" :title="tweet.created_at">
                    <router-link :to="{ name: 'Tweet', params: { tweet: tweet.publicKey.toBase58() } }" class="hover:underline">
                        {{ tweet.created_ago }}
                    </router-link>
                </time>
            </div>
        
        </div>
        <div class="flex flex-wrap items-center justify-between -m-2">
                <div class="relative m-2 mr-4">
                    <p class="text-blue-800 rounded-full pl-10 pr-4 py-2 bg-gray-500" v-text="tweet.content"></p>
                </div>

                <router-link v-if="tweet.topic" :to="{ name: 'Topics', params: { topic: tweet.topic } }" class="inline-block mt-2 text-blue-500 hover:underline break-all">
            #{{ tweet.topic }}
        </router-link>
                
                <div class="relative m-2 mr-4">
                    Poster Stake
                    <p class="text-blue-800 rounded-full pl-10 pr-4 py-2 bg-gray-500" v-text="tweet.amount"></p>
                </div>
                
                <div class="relative m-2 mr-4">
                    Market Size
                    <p class="text-blue-800 rounded-full pl-10 pr-4 py-2 bg-gray-500" v-text="tweet.threshold"></p>
                </div>
                </div>
        
        <div class="flex" v-if="!isMyTweet">
            <button @click="mayGoLong = true" class="flex px-2 rounded-full text-gray-500 hover:text-blue-800 hover:bg-gray-100" title="Go Long">
                    <img src="https://static.thenounproject.com/png/58345-200.png" style="max-width: 30px" alt=""/>
            </button>
            <button @click="mayGoShort = true" class="flex px-2 rounded-full text-gray-500 hover:text-blue-500 hover:bg-gray-100" title="Go Short">
                <img src="https://cdn-icons-png.flaticon.com/512/26/26103.png" style="max-width: 30px" alt="">
            </button>
        </div>
    </div>
</template>
