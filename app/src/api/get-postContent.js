import { useWorkspace } from '@/composables'
import { PostContent } from '@/models'

export const getPostContent = async (publicKey) => {
    const { program } = useWorkspace()
    const account = await program.value.account.content.fetch(publicKey);
    console.log(account)
    return new PostContent(publicKey, account)
}
