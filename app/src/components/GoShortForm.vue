<script setup>
import { computed, ref, toRefs } from 'vue'
import { useAutoresizeTextarea, useCountCharacterLimit, useSlug } from '@/composables'
import { validateContent } from '@/api'
import { useWallet } from 'solana-wallets-vue'

// Props.
const props = defineProps({
    postContent: Object,
})
const { postContent } = toRefs(props)

// Form data.
const content = ref(postContent.value.content)
const topic = ref(postContent.value.topic)
const amount = ref()
const slugTopic = useSlug(topic)

// Auto-resize the content's textarea.
const textarea = ref()
useAutoresizeTextarea(textarea)

// Character limit / count-down.
const characterLimit = useCountCharacterLimit(content, 280)

// Permissions.
const { connected } = useWallet()
// const canPostContent = computed(() => content.value && characterLimit.value > 0)

// Actions.
const emit = defineEmits(['close'])
const validate = async () => {
    // if (! canPostContent.value) return
    await validateContent(postContent.value, amount.value, "short")
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
                <div class="relative m-2 mr-4">
                    <p class="text-blue-800 rounded-full pl-10 pr-4 py-2 bg-gray-500" v-text="postContent.content"></p>
                </div>

                    <!-- Topic field. -->
                <div class="relative m-2 mr-4">
                    <p class="text-blue-800 rounded-full pl-10 pr-4 py-2 bg-gray-500" v-text="postContent.topic"></p>
                    <div class="absolute left-0 inset-y-0 flex pl-3 pr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 m-auto" :class="slugTopic ? 'text-blue-800' : 'text-gray-400'" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M9.243 3.03a1 1 0 01.727 1.213L9.53 6h2.94l.56-2.243a1 1 0 111.94.486L14.53 6H17a1 1 0 110 2h-2.97l-1 4H15a1 1 0 110 2h-2.47l-.56 2.242a1 1 0 11-1.94-.485L10.47 14H7.53l-.56 2.242a1 1 0 11-1.94-.485L5.47 14H3a1 1 0 110-2h2.97l1-4H5a1 1 0 110-2h2.47l.56-2.243a1 1 0 011.213-.727zM9.03 8l-1 4h2.938l1-4H9.031z" clip-rule="evenodd" />
                        </svg>
                    </div>
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
                        class="text-white px-4 py-2 rounded-full bg-blue-800 font-semibold"                   @click="validate"
                    >
                        Go Short
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div v-else class="px-8 py-4 bg-gray-50 text-gray-500 text-center border-b">
        Connect your wallet to start posting...
    </div>
</template>