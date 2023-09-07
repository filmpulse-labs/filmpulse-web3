<script setup>
import { computed, ref, toRefs } from 'vue'
import { useAutoresizeTextarea, useCountCharacterLimit, useSlug } from '@/composables'
import { sendPostContent } from '@/api'
import { useWallet } from 'solana-wallets-vue'
import { WebBundlr } from "@bundlr-network/client";

// Props.
const props = defineProps({
    forcedTopic: String,
})
const { forcedTopic } = toRefs(props)

// Form data.
const arweaveLink = ref(''); // Added ref for Arweave link
const content = ref('')
const market = ref('')
const amount = ref()
const activeTab = ref('form1');
const threshold = ref()
const slugTopic = useSlug(market)
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
    const postContent = await sendPostContent(content.value, market.value, amount.value, threshold.value)
    emit('added', postContent)
    market.value = ''
    content.value = ''
    amount.value = ''
    threshold.value = ''
}

async function uploadViaBundlr(file) {
    try {

        let wallet = useWallet();

        const bundlr = new WebBundlr("https://devnet.bundlr.network", "solana", wallet.wallet.value, {
        providerUrl: "https://api.devnet.solana.com",
        });

        await bundlr.ready();

        // Print your wallet address
        console.log(`wallet address = ${bundlr.address}`);

        const price = await bundlr.getPrice(file.size);
        console.log(price);

        await bundlr.fund(price);

        const buffer = Buffer.from(file, "utf-8")

        const tags = [{ name: "Content-Type", value: "image/png" }];
        const response = await bundlr.upload(buffer, { tags: tags });

        arweaveLink.value = "https://arweave.net/" + response.id;

        console.log(`Data Available at => https://arweave.net/${response.id}`);

    } catch (error) {
        console.error('Error uploading via Bundlr:', error);
        // Handle error as needed
    }
}

// Function to handle image upload
const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
        await uploadViaBundlr(file);
        // Fill the content field with the Arweave link
        content.value = arweaveLink.value;
    }
}
</script>

<template>
    <div v-if="connected" class="px-8 py-4 border-b">
        <div>
            <div class="tabs">

                <button
                    class="tab"
                    :class="{ active: activeTab === 'form1' }"
                    @click="activeTab = 'form1'"
                >
                    Micro
                </button>
                <button
                    class="tab"
                    :class="{ active: activeTab === 'form2' }"
                    @click="activeTab = 'form2'"
                >
                    Blog
                </button>
                <button
                    class="tab"
                    :class="{ active: activeTab === 'form3' }"
                    @click="activeTab = 'form3'"
                >
                    Image
                </button>
                <button
                    class="tab"
                    :class="{ active: activeTab === 'form4' }"
                    @click="activeTab = 'form4'"
                >
                    Audio
                </button>
                <button
                    class="tab"
                    :class="{ active: activeTab === 'form5' }"
                    @click="activeTab = 'form5'"
                >
                    Video
                </button>
            </div>

    <div v-if="activeTab === 'form1'">
        <br>
        
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
                    placeholder="Market Prompt"
                    class="text-blue-800 rounded-full pl-5 pr-1 py-2 bg-gray-500"
                    :value="effectiveTopic"
                    :disabled="forcedTopic"
                    @input="market = $event.target.value"
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
            <div class="relative m-2 mr-4">
                <input
                    type="number"
                    placeholder="SOL"
                    class="text-blue-800 rounded-full pl-5 pr-1 py-2 bg-gray-500"
                    @input="amount = $event.target.value"
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

    <div v-else-if="activeTab === 'form2'">
      <!-- Upload input -->
      <div class="relative m-2 mr-4">
            <label for="imageUpload" class="block mb-2 text-blue-800">Upload Text</label>
            <input
                id="imageUpload"
                type="file"
                accept="text/*"
                @change="handleImageUpload"
                class="hidden"
            >
        </div>

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
                placeholder="Market Prompt"
                class="text-blue-800 rounded-full pl-5 pr-1 py-2 bg-gray-500"
                :value="effectiveTopic"
                :disabled="forcedTopic"
                @input="market = $event.target.value"
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
        <div class="relative m-2 mr-4">
            <input
                type="number"
                placeholder="SOL"
                class="text-blue-800 rounded-full pl-5 pr-1 py-2 bg-gray-500"
                @input="amount = $event.target.value"
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

    <div v-else-if="activeTab === 'form3'">
        <div class="relative m-2 mr-4">
            <label for="imageUpload" class="block mb-2 text-blue-800">Upload Image</label>
            <input
                id="imageUpload"
                type="file"
                accept="image/*"
                @change="handleImageUpload"
                class="hidden"
            >
        </div>

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
                placeholder="Market Prompt"
                class="text-blue-800 rounded-full pl-5 pr-1 py-2 bg-gray-500"
                :value="effectiveTopic"
                :disabled="forcedTopic"
                @input="market = $event.target.value"
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
        <div class="relative m-2 mr-4">
            <input
                type="number"
                placeholder="SOL"
                class="text-blue-800 rounded-full pl-5 pr-1 py-2 bg-gray-500"
                @input="amount = $event.target.value"
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

    <div v-else-if="activeTab === 'form4'">
            <!-- Upload input -->
        <div class="relative m-2 mr-4">
            <label for="imageUpload" class="block mb-2 text-blue-800">Upload Audio</label>
            <input
                id="imageUpload"
                type="file"
                accept=".mp3, .wav, .ogg, .mp4, .webm"
                @change="handleImageUpload"
                class="hidden"
            >
        </div>

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
                placeholder="Market Prompt"
                class="text-blue-800 rounded-full pl-5 pr-1 py-2 bg-gray-500"
                :value="effectiveTopic"
                :disabled="forcedTopic"
                @input="market = $event.target.value"
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
        <div class="relative m-2 mr-4">
            <input
                type="number"
                placeholder="SOL"
                class="text-blue-800 rounded-full pl-5 pr-1 py-2 bg-gray-500"
                @input="amount = $event.target.value"
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

    <div v-else>
             <!-- Upload input -->
             <div class="relative m-2 mr-4">
            <label for="imageUpload" class="block mb-2 text-blue-800">Upload Video</label>
            <input
                id="imageUpload"
                type="file"
                accept=".mp3, .wav, .ogg, .mp4, .webm"
                @change="handleImageUpload"
                class="hidden"
            >
        </div>

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
                placeholder="Market Prompt"
                class="text-blue-800 rounded-full pl-5 pr-1 py-2 bg-gray-500"
                :value="effectiveTopic"
                :disabled="forcedTopic"
                @input="market = $event.target.value"
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
        <div class="relative m-2 mr-4">
            <input
                type="number"
                placeholder="SOL"
                class="text-blue-800 rounded-full pl-5 pr-1 py-2 bg-gray-500"
                @input="amount = $event.target.value"
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
  </div>

    </div>

    <div v-else class="px-8 py-4 bg-gray-50 text-gray-500 text-center border-b">
        Connect your wallet to start posting...
    </div>
</template>

<style>
.tabs {
  display: flex;
  justify-content: center;
  flex-wrap: wrap; /* Allow tabs to wrap into new lines */
}

.tab {
  padding: 8px 16px;
  background-color: blue;
  border: none;
  border-radius: 20px;
  color: white;
  cursor: pointer;
  margin: 8px; /* Adjust margin for spacing between tabs */
}

.tab.active {
  background-color: darkblue;
}
</style>
