<script setup>
import { ref, toRefs, computed } from 'vue'
import { useWorkspace } from '@/composables'
// import { deletePostContent } from '@/api'
import PostContentFormUpdate from './PostContentFormUpdate'
import PostContentFormUpdate1 from './PostContentFormUpdate1'

// const emit = defineEmits(['delete']);
const props = defineProps({
    postContent: Object,
})

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

const mayGoLong = ref(false)
const mayGoShort = ref(false)

</script>

<template>

    <postContent-form-update v-if="mayGoLong" :postContent="postContent" @close="mayGoLong = false"></postContent-form-update>
    <postContent-form-update1 v-if="mayGoShort" :postContent="postContent" @close="mayGoShort = false"></postContent-form-update1>
    <div class="px-8 py-4" v-else>
        <div class="flex justify-between">
            <div class="py-1">
                <h3 class="inline font-semibold" :title="postContent.author">
                    <router-link :to="authorRoute" class="hover:underline">
                        {{ postContent.author_display }}
                    </router-link>
                </h3>
                <span class="text-gray-500"> • </span>
                <time class="text-gray-500 text-sm" :title="postContent.created_at">
                    <router-link :to="{ name: 'PostContent', params: { postContent: postContent.publicKey.toBase58() } }" class="hover:underline">
                        {{ postContent.created_ago }}
                    </router-link>
                </time>
            </div>
        
        </div>
        <div class="flex flex-wrap items-center justify-between -m-2">
                <div class="relative m-2 mr-4">
                    <p class="text-blue-800 rounded-full pl-10 pr-4 py-2 bg-gray-500" v-text="postContent.content"></p>
                </div>

                <router-link v-if="postContent.topic" :to="{ name: 'Topics', params: { topic: postContent.topic } }" class="inline-block mt-2 text-blue-500 hover:underline break-all">
            #{{ postContent.topic }}
        </router-link>
                
                <div class="relative m-2 mr-4">
                    Poster Stake
                    <p class="text-blue-800 rounded-full pl-10 pr-4 py-2 bg-gray-500" v-text="postContent.amount"></p>
                </div>
                
                <div class="relative m-2 mr-4">
                    Market Size
                    <p class="text-blue-800 rounded-full pl-10 pr-4 py-2 bg-gray-500" v-text="postContent.threshold"></p>
                </div>
                </div>
        
        <div class="flex" v-if="!isMyPostContent">
            <button @click="mayGoLong = true" class="flex px-2 rounded-full text-gray-500 hover:text-blue-800 hover:bg-gray-100" title="Go Long">
                    <img src="https://static.thenounproject.com/png/58345-200.png" style="max-width: 30px" alt=""/>
            </button>
            <button @click="mayGoShort = true" class="flex px-2 rounded-full text-gray-500 hover:text-blue-500 hover:bg-gray-100" title="Go Short">
                <img src="https://cdn-icons-png.flaticon.com/512/26/26103.png" style="max-width: 30px" alt="">
            </button>
        </div>
    </div>
</template>
