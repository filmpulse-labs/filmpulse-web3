import dayjs from "dayjs"

export class Tweet
{
    constructor (publicKey, accountData) {
        this.publicKey = publicKey
        this.poster = accountData.poster
        this.timestamp = accountData.timestamp.toString()
        this.topic = accountData.topic
        this.content = accountData.contentLink
        this.amount = accountData.amount/1000000000
        this.threshold = accountData.validatorThreshold
    }

    get key () {
        return this.publicKey.toBase58()
    }

    get author_display () {
        const author = this.poster.toBase58()
        return author.slice(0,4) + '..' + author.slice(-4)
    }

    get created_at () {
        return dayjs.unix(this.timestamp).format('lll')
    }

    get created_ago () {
        return dayjs.unix(this.timestamp).fromNow()
    }
}
