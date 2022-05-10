import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { SolanaGopulse } from '../target/types/solana_gopulse';
import * as assert from "assert";
import * as bs58 from "bs58";

describe('solana-gopulse', () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.Provider.env());
    const program = anchor.workspace.SolanaGopulse as Program<SolanaGopulse>;
    const postContent = async (author, primaryTag, primaryContent, tag0, authorKeys) => {
        const content = anchor.web3.Keypair.generate();
        await program.rpc.postContent(primaryTag, primaryContent, tag0, authorKeys, {
            accounts: {
                content: content.publicKey,
                author,
                systemProgram: anchor.web3.SystemProgram.programId,
            },
            signers: [content],
        });

        return content
    }

    it('can post new content', async () => {
        // Call the "postContent" instruction.
        const content = anchor.web3.Keypair.generate();
        await program.rpc.postContent('dune', 'a good review', 3, ['ffdfff', 'gop'], {
            accounts: {
                content: content.publicKey,
                author: program.provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            },
            signers: [content],
        });

        // Fetch the account details of the created content.
        const contentAccount = await program.account.content.fetch(content.publicKey);
        console.log("New Content Account: " + contentAccount.author.toString());

        const contentAccounts = await program.account.content.all();
        for (let content of contentAccounts) {
            console.log("All Content Accounts: " + content.account.author.toString());
        }

        // Ensure it has the right data.
        assert.equal(contentAccount.author.toBase58(), program.provider.wallet.publicKey.toBase58());
        assert.equal(contentAccount.title, 'dune');
        assert.equal(contentAccount.essay, 'a good review');
        assert.equal(contentAccount.rating, 3);
        assert.ok(contentAccount.timestamp);
    });

    it('can post a new review from a different author', async () => {
        // Generate another user and airdrop them some SOL.
        const otherUser = anchor.web3.Keypair.generate();
        const signature = await program.provider.connection.requestAirdrop(otherUser.publicKey, 1000000000);
        await program.provider.connection.confirmTransaction(signature);

        // Call the "SendTweet" instruction on behalf of this other user.
        const content = anchor.web3.Keypair.generate();
        await program.rpc.postContent('taxi-driver', 'Yay taxis', 2, ['ffdfff'], {
            accounts: {
                content: content.publicKey,
                author: otherUser.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            },
            signers: [otherUser, content],
        });

        // Fetch the account details of the created tweet.
        const reviewAccount = await program.account.content.fetch(content.publicKey);

        const reviewAccounts = await program.account.content.all();
        for (let review of reviewAccounts) {
            console.log("All Review Accounts: " + review.account.author.toString());
        }

        // Ensure it has the right data.
        assert.equal(reviewAccount.author.toBase58(), otherUser.publicKey.toBase58());
        assert.equal(reviewAccount.title, 'taxi-driver');
        assert.equal(reviewAccount.essay, 'Yay taxis');
        assert.equal(reviewAccount.rating, 2);
        assert.ok(reviewAccount.timestamp);
    });

    it('can fetch all reviews', async () => {
        const reviewAccounts = await program.account.content.all();
        assert.equal(reviewAccounts.length, 2);
    });

    it('can send another new review', async () => {
        const reviewAccounts = await program.account.content.all();
        let keysToPass = [];
        for (let reviewAccount of reviewAccounts) {
            let authorAddress = reviewAccount.account.author.toString()
            console.log("All Review Accounts: " + authorAddress);
            keysToPass.push(authorAddress);
        }
        console.log(keysToPass);
        // Call the "postReview" instruction.
        const content = anchor.web3.Keypair.generate();
        await program.rpc.postContent('dune', 'another good review', 3, keysToPass, {
            accounts: {
                content: content.publicKey,
                author: program.provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            },
            signers: [content],
        });

        // Fetch the account details of the created tweet.
        const reviewAccount = await program.account.content.fetch(content.publicKey);

        // Ensure it has the right data.
        assert.equal(reviewAccount.author.toBase58(), program.provider.wallet.publicKey.toBase58());
        assert.equal(reviewAccount.title, 'dune');
        assert.equal(reviewAccount.essay, 'another good review');
        assert.equal(reviewAccount.rating, 3);
        assert.ok(reviewAccount.timestamp);
    });

    it('can verify a review', async () => {
        const reviewAccounts = await program.account.content.all();
        let theKey = reviewAccounts[0].publicKey;
        const verify = anchor.web3.Keypair.generate();
        await program.rpc.verifyReview(theKey, {
            accounts: {
                verify: verify.publicKey,
                author: program.provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            },
            signers: [verify],
        });

        // Fetch the account details of the created tweet.
        const verifyAccount = await program.account.verify.fetch(verify.publicKey);
    });

    it('can filter reviews by author', async () => {
        const authorPublicKey = program.provider.wallet.publicKey
        const reviewAccounts = await program.account.content.all([
            {
                memcmp: {
                    offset: 8, // Discriminator.
                    bytes: authorPublicKey.toBase58(),
                }
            }
        ]);

        assert.equal(reviewAccounts.length, 2);
        assert.ok(reviewAccounts.every(reviewAccount => {
            return reviewAccount.account.author.toBase58() === authorPublicKey.toBase58()
        }))
    });

    it('can filter reviews by topic', async () => {
        const reviewAccounts = await program.account.content.all([
            {
                memcmp: {
                    offset: 8 + // Discriminator.
                        32 + // Author public key.
                        8 + // Timestamp.
                        4, // Topic string prefix.
                    bytes: bs58.encode(Buffer.from('dune')),
                }
            }
        ]);

        assert.equal(reviewAccounts.length, 2);
        assert.ok(reviewAccounts.every(reviewAccount => {
            return reviewAccount.account.title === 'dune'
        }))
    });

    // it('cannot provide a title with more than 50 characters', async () => {
    //     try {
    //         const review = anchor.web3.Keypair.generate();
    //         const titleWith51Chars = 'x'.repeat(51);
    //         await program.rpc.postReview(titleWith51Chars, 'a great film essay', {
    //             accounts: {
    //                 review: review.publicKey,
    //                 author: program.provider.wallet.publicKey,
    //                 systemProgram: anchor.web3.SystemProgram.programId,
    //             },
    //             signers: [review],
    //         });
    //     } catch (error) {
    //         assert.equal(error.msg, 'The provided title should be 50 characters long maximum.');
    //         return;
    //     }

    //     assert.fail('The instruction should have failed with a 51-character title.');
    // });

    // it('cannot provide a review with more than 280 characters', async () => {
    //     try {
    //         const review = anchor.web3.Keypair.generate();
    //         const reviewWith281Chars = 'x'.repeat(281);
    //         await program.rpc.sendTweet('2001', contentWith281Chars, {
    //             accounts: {
    //                 review: review.publicKey,
    //                 author: program.provider.wallet.publicKey,
    //                 systemProgram: anchor.web3.SystemProgram.programId,
    //             },
    //             signers: [review],
    //         });
    //     } catch (error) {
    //         assert.equal(error.msg, 'The provided review should be 280 characters long maximum.');
    //         return;
    //     }

    //     assert.fail('The instruction should have failed with a 281-character review.');
    // });

});