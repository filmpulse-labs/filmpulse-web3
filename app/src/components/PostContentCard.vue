<script setup>
import { ref, toRefs, computed, onMounted } from 'vue'
import { fetchUser, posterCollect, validatorCollect } from '@/api'
import { useWorkspace } from '@/composables'
import GoLongForm from './GoLongForm'
import GoShortForm from './GoShortForm'
import { PublicKey } from '@solana/web3.js'

const props = defineProps({
    postContent: Object,
})

const counter = ref()
const poster = ref()
const useravatar = ref()
const username = ref()

const { postContent } = toRefs(props)
const { wallet } = useWorkspace()
const isMyPostContent = computed(() => wallet.value && wallet.value.publicKey.toBase58() === postContent.value.poster.toBase58())
const authorRoute = computed(() => {
    if (isMyPostContent.value) {
        return { name: 'Profile' }
    } else {
        return { name: 'Users', params: { author: postContent.value.poster.toBase58() } }
    }
})

counter.value = postContent.value.postCounter
poster.value = postContent.value.poster

const collectPoster = async () => {
    console.log("collection running..." + counter.value)
    await posterCollect(counter.value)
}

const collectValidator = async () => {
    console.log("collection running..." + counter.value)
    await validatorCollect(poster.value, counter.value)
}

const mayGoLong = ref(false)
const mayGoShort = ref(false)

onMounted(async () => {
    try {
        const publicKey = new PublicKey(postContent.value.poster.toBase58())
        const user = await fetchUser(publicKey)
        useravatar.value = user.avatar
        username.value = user.name
    } catch (error) {
        console.log(error)
    }
})
</script>

<template>
    <go-long-form v-if="mayGoLong" :postContent="postContent" @close="mayGoLong = false"></go-long-form>
    <go-short-form v-if="mayGoShort" :postContent="postContent" @close="mayGoShort = false"></go-short-form>

    <div class="px-8 py-4" v-else-if="!mayGoLong">
        <div class="flex justify-between">
            <div class="py-1">
                <router-link :to="authorRoute" class="hover:underline">

                <div class="flex items-center">
                    <img style="border-radius: 50%; max-height: 50px; max-width: 50px; margin-right: 16px; object-fit: cover; aspect-ratio: 1/1;" :src="useravatar" alt="User Avatar">
                    <h1 class="inline font-semibold text-lg" :title="username">
                    
                            {{ username }}
                      
                    </h1>
                </div>
                    <h3 class="inline font-semibold" :title="postContent.author">
                            {{ postContent.author_display }}
                        
                    </h3>
                </router-link>
                <span class="text-gray-500"> • </span>
                <time class="text-gray-500 text-sm" :title="postContent.created_at">
                    <router-link :to="{ name: 'PostContent', params: { postContent: postContent.publicKey.toBase58() } }" class="hover:underline">
                        {{ postContent.created_ago }}
                    </router-link>
                </time>
            </div>
        </div>
      

        <div class="flex flex-wrap items-center justify-between -m-2">
            <router-link v-if="postContent.topic" :to="{ name: 'Topics', params: { topic: postContent.topic } }" class="inline-block mt-2 text-blue-500 hover:underline break-all">
                #{{ postContent.topic }}
            </router-link>
            <div style="-ms-word-break: break-all; word-break: break-all; word-break: break-word;
                        -webkit-hyphens: auto; -moz-hyphens: auto; -ms-hyphens: auto; hyphens: auto;" class="m-2 mr-4">
                <p class="text-blue-800 rounded pl-4 pr-4 py-2 bg-gray-500" v-text="postContent.content">
                </p>
            </div>
            
            <div class="m-2 mr-4">
                Poster Stake
                <p class="text-blue-800 rounded-full pl-10 pr-4 py-2 bg-gray-500" v-text="postContent.amount"></p>
            </div>
            
            <div class="m-2 mr-4">
                Market Size
                <p class="text-blue-800 rounded-full pl-10 pr-4 py-2 bg-gray-500" v-text="postContent.threshold"></p>
            </div>
            <!-- <div class="m-2 mr-4">
                Long Pool
                <p class="text-blue-800 rounded-full pl-10 pr-4 py-2 bg-gray-500" v-text="postContent.longPool"></p>
            </div>
            <div class="m-2 mr-4">
                Short Pool
                <p class="text-blue-800 rounded-full pl-10 pr-4 py-2 bg-gray-500" v-text="postContent.shortPool"></p>
            </div> -->
            <div class="m-2 mr-4">
                Total Pool
                <p class="text-blue-800 rounded-full pl-10 pr-4 py-2 bg-gray-500" v-text="postContent.totalPool"></p>
            </div>
            <!-- <div class="m-2 mr-4">
                Validator Count
                <p class="text-blue-800 rounded-full pl-10 pr-4 py-2 bg-gray-500" v-text="postContent.validatorCount"></p>
            </div> -->
            <div class="m-2 mr-4">
                Market Open
                <p class="text-blue-800 rounded-full pl-10 pr-4 py-2 bg-gray-500" v-text="!postContent.validatorThresholdReached"></p>
            </div>
        </div>
        <div style="display: flex; justify-content: center;" class="flex" v-if="!isMyPostContent && !postContent.validatorThresholdReached">
            <button @click="mayGoLong = true" class="flex px-2 rounded-full hover:bg-blue-800" title="Go Long">
                <img src="https://static.thenounproject.com/png/58345-200.png" style="max-width: 50px; transform: scaleX(-1);" alt=""/>
            </button>
            <button @click="mayGoShort = true" class="flex px-2 rounded-full hover:bg-blue-800" title="Go Short">
                <img src="https://cdn-icons-png.flaticon.com/512/26/26103.png" style="max-width: 50px" alt="">
            </button>
        </div>
        <div style="display: flex; justify-content: center;" class="flex">
            <button v-if="postContent.validatorThresholdReached && isMyPostContent" @click="collectPoster" class="text-center flex px-2 rounded-full hover:bg-blue-800" title="Poster Collect">
                <img src="https://static.thenounproject.com/png/3249399-200.png" style="max-width: 50px" alt="">
            </button>
            <button v-if="postContent.validatorThresholdReached && !isMyPostContent" @click="collectValidator" class="flex px-2 rounded-full hover:bg-blue-800" title="Validator Collect">
                <img src="https://static.thenounproject.com/png/3249399-200.png" style="max-width: 50px" alt="">
            </button>
        </div>
    </div>    
</template>