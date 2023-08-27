import dayjs from "dayjs"

export class PostContent
{
    constructor (publicKey, accountData) {
        this.publicKey = publicKey
        this.poster = accountData.poster
        this.timestamp = accountData.timestamp.toString()
        this.market = accountData.market
        this.content = accountData.contentLink
        this.amount = accountData.amount/1000000000
        this.threshold = accountData.validatorThreshold
        this.postCounter = accountData.postCounter
        this.totalPool = accountData.totalPool/1000000000
        this.shortPool = accountData.shortPool/1000000000
        this.longPool = accountData.longPool/1000000000
        this.shortWin = accountData.shortWin
        this.validatorCount = accountData.validatorCount
        this.validatorThresholdReached = accountData.validatorThresholdReached
        this.dispersement = accountData.dispersement
        this.dispersed = accountData.dispersed
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