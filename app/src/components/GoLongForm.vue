<script setup>
import { ref, toRefs } from 'vue'
import { useAutoresizeTextarea } from '@/composables'
import { validateContent } from '@/api'
import { useWallet } from 'solana-wallets-vue'

// Props.
const props = defineProps({
    postContent: Object,
})
const { postContent } = toRefs(props)

// Form data.
const amount = ref()

// Auto-resize the content's textarea.
const textarea = ref()
useAutoresizeTextarea(textarea)

// Permissions.
const { connected } = useWallet()
// const canPostContent = computed(() => content.value && characterLimit.value > 0)

// Actions.
const emit = defineEmits(['close'])
const validate = async () => {
    // if (! canPostContent.value) return
    await validateContent(postContent.value, amount.value, "long")
    emit('close')
}
</script>

<template>
    <div v-if="connected">
        <div class="px-8 py-4 border-l-4 border-blue-800">
            <div class="py-1">
                <h3 class="inline font-semibold" :title="postContent.author">
                    <router-link :to="{ name: 'Profile' }" class="hover:underline">
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
            
            <!-- Content field. -->
            <div class="flex flex-wrap items-center justify-between -m-2">
            <router-link v-if="postContent.topic" :to="{ name: 'Topics', params: { topic: postContent.topic } }" class="inline-block mt-2 text-blue-500 hover:underline break-all">
                #{{ postContent.topic }}
            </router-link>
            <div style="-ms-word-break: break-all; word-break: break-all; word-break: break-word;
                        -webkit-hyphens: auto; -moz-hyphens: auto; -ms-hyphens: auto; hyphens: auto;" class="m-2 mr-4">
                <p class="text-blue-800 rounded pl-4 pr-4 py-2 bg-gray-500" v-text="postContent.content">
                </p>
            </div>
                <div class="relative m-2 mr-4">
                <input
                    type="number"
                    placeholder="SOL"
                    class="text-blue-800 rounded-full pl-3 pr-4 py-2 bg-gray-500"
                    @input="amount = $event.target.value"
                >
            </div>
            <div class="flex items-center space-x-4 m-2 ml-auto">

                <!-- Close button. -->
                <button
                    class="text-gray-500 px-4 py-2 rounded-full border bg-white hover:bg-gray-50"
                    @click="emit('close')"
                >
                    Cancel
                </button>

                <!-- PostContent button. -->
                <button
                    class="text-white px-4 py-2 rounded-full bg-blue-800 font-semibold" 
                    @click="validate"
                >
                    Go Long
                </button>
            </div>
            </div>
        </div>
    </div>

    <div v-else class="px-8 py-4 bg-gray-50 text-gray-500 text-center border-b">
        Connect your wallet to start posting...
    </div>
</template>