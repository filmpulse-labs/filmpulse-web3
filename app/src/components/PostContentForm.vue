<script setup>
import { computed, ref, toRefs } from 'vue'
import { useAutoresizeTextarea, useCountCharacterLimit, useSlug } from '@/composables'
import { sendPostContent } from '@/api'
import { useWallet } from 'solana-wallets-vue'

// Props.
const props = defineProps({
    forcedTopic: String,
})
const { forcedTopic } = toRefs(props)

// Form data.
const content = ref('')
const topic = ref('')
const amount = ref()
const threshold = ref()
const slugTopic = useSlug(topic)
const effectiveTopic = computed(() => forcedTopic.value ?? slugTopic.value)

// Auto-resize the content's textarea.
const textarea = ref()
useAutoresizeTextarea(textarea)

// Character limit / count-down.
const characterLimit = useCountCharacterLimit(content, 420)
const characterLimitColour = computed(() => {
    if (characterLimit.value < 0) return 'text-red-500'
    if (characterLimit.value <= 10) return 'text-yellow-500'
    return 'text-gray-400'
})

// Permissions.
const { connected } = useWallet()
const canPostContent = computed(() => content.value && characterLimit.value > 0)

// Actions.
const emit = defineEmits(['added'])
const send = async () => {
    if (! canPostContent.value) return
    const postContent = await sendPostContent(content.value, topic.value, amount.value, threshold.value)
    emit('added', postContent)
    topic.value = ''
    content.value = ''
    amount.value = ''
    threshold.value = ''
}

</script>

<template>
    <div v-if="connected" class="px-8 py-4 border-b">

        <!-- Content field. -->
        <textarea
            ref="textarea"
            rows="1"
            class="text-xl rounded w-full focus:outline-none pl-5 py-5 resize-none mb-3 bg-gray-500"
            placeholder="Say something smart or post a link..."
            v-model="content"
        ></textarea>

        <div class="flex flex-wrap items-center justify-between -m-2">

            <!-- Topic field. -->
            <div class="relative m-2 mr-4">
                <input
                    type="text"
                    placeholder="Topic"
                    class="text-blue-800 rounded-full pl-5 pr-1 py-2 bg-gray-500"
                    :value="effectiveTopic"
                    :disabled="forcedTopic"
                    @input="topic = $event.target.value"
                >
               
            </div>
            <div class="relative m-2 mr-4">
                <input
                    type="float"
                    placeholder="SOL"
                    class="text-blue-800 rounded-full pl-5 pr-1 py-2 bg-gray-500"
                    @input="amount = $event.target.value"
                >
                
            </div>
            <div class="relative m-2 mr-4">
                <input
                    type="number"
                    placeholder="Market Size"
                    class="text-blue-800 rounded-full pl-5 pr-1 py-2 bg-gray-500"
                    @input="threshold = $event.target.value"
                >
        
            </div>
            <div class="flex items-center space-x-6 m-2 ml-auto">

                <!-- Character limit. -->
                <div :class="characterLimitColour">
                    {{ characterLimit }} left
                </div>

                <!-- PostContent button. -->
                <button
                    class="text-white px-4 py-2 rounded-full font-semibold" :disabled="! canPostContent"
                    :class="canPostContent ? 'bg-blue-800' : 'bg-blue-800 cursor-not-allowed'"
                    @click="send"
                >
                    Post
                </button>
            </div>
        </div>
    </div>

    <div v-else class="px-8 py-4 bg-gray-50 text-gray-500 text-center border-b">
        Connect your wallet to start posting...
    </div>
</template>