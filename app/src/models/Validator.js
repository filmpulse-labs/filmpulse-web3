import dayjs from "dayjs"

export class Validator
{
    constructor (publicKey, accountData) {
        this.publicKey = publicKey
        this.validator = accountData.validator
        this.content = accountData.content
        this.timestamp = accountData.timestamp.toString()
        this.amount = accountData.amount/1000000000
        this.dispersement = accountData.dispersement
        this.dispersed = accountData.dispersed
        this.count = accountData.count
        this.position = accountData.position
    }

    get key () {
        return this.publicKey.toBase58()
    }

    get validator_display () {
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