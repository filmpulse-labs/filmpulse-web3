import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { SolanaFilmpulse } from '../target/types/solana_filmpulse';
import * as assert from "assert";
import * as bs58 from "bs58";

describe('solana-filmpulse', () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.Provider.env());
    const program = anchor.workspace.SolanaFilmpulse as Program<SolanaFilmpulse>;
    const postReview = async (author, title, essay, rating, authorKeys) => {
        const review = anchor.web3.Keypair.generate();
        await program.rpc.postReview(title, essay, rating, authorKeys, {
            accounts: {
                review: review.publicKey,
                author,
                systemProgram: anchor.web3.SystemProgram.programId,
            },
            signers: [review],
        });

        return review
    }

    it('can post a new review', async () => {
        // Call the "SendTweet" instruction.
        const review = anchor.web3.Keypair.generate();
        await program.rpc.postReview('dune', 'a good review', 3, ['ffdfff', 'gop'], {
            accounts: {
                review: review.publicKey,
                author: program.provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            },
            signers: [review],
        });

        // Fetch the account details of the created tweet.
        const reviewAccount = await program.account.review.fetch(review.publicKey);
        console.log("New Review Account: " + reviewAccount.author.toString());

        const reviewAccounts = await program.account.review.all();
        for (let review of reviewAccounts) {
            console.log("All Review Accounts: " + review.account.author.toString());
        }

        // Ensure it has the right data.
        assert.equal(reviewAccount.author.toBase58(), program.provider.wallet.publicKey.toBase58());
        assert.equal(reviewAccount.title, 'dune');
        assert.equal(reviewAccount.essay, 'a good review');
        assert.equal(reviewAccount.rating, 3);
        assert.ok(reviewAccount.timestamp);
    });

    it('can post a new review from a different author', async () => {
        // Generate another user and airdrop them some SOL.
        const otherUser = anchor.web3.Keypair.generate();
        const signature = await program.provider.connection.requestAirdrop(otherUser.publicKey, 1000000000);
        await program.provider.connection.confirmTransaction(signature);

        // Call the "SendTweet" instruction on behalf of this other user.
        const review = anchor.web3.Keypair.generate();
        await program.rpc.postReview('taxi-driver', 'Yay taxis', 2, ['ffdfff'], {
            accounts: {
                review: review.publicKey,
                author: otherUser.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            },
            signers: [otherUser, review],
        });

        // Fetch the account details of the created tweet.
        const reviewAccount = await program.account.review.fetch(review.publicKey);

        const reviewAccounts = await program.account.review.all();
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
        const reviewAccounts = await program.account.review.all();
        assert.equal(reviewAccounts.length, 2);
    });

    it('can send another new review', async () => {
        const reviewAccounts = await program.account.review.all();
        let keysToPass = [];
        for (let reviewAccount of reviewAccounts) {
            let authorAddress = reviewAccount.account.author.toString()
            console.log("All Review Accounts: " + authorAddress);
            keysToPass.push(authorAddress);
        }
        console.log(keysToPass);
        // Call the "postReview" instruction.
        const review = anchor.web3.Keypair.generate();
        await program.rpc.postReview('dune', 'another good review', 3, keysToPass, {
            accounts: {
                review: review.publicKey,
                author: program.provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            },
            signers: [review],
        });

        // Fetch the account details of the created tweet.
        const reviewAccount = await program.account.review.fetch(review.publicKey);

        // Ensure it has the right data.
        assert.equal(reviewAccount.author.toBase58(), program.provider.wallet.publicKey.toBase58());
        assert.equal(reviewAccount.title, 'dune');
        assert.equal(reviewAccount.essay, 'another good review');
        assert.equal(reviewAccount.rating, 3);
        assert.ok(reviewAccount.timestamp);
    });

    it('can verify a review', async () => {
        const reviewAccounts = await program.account.review.all();
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
        const reviewAccounts = await program.account.review.all([
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
        const reviewAccounts = await program.account.review.all([
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

    it('can delete a review', async () => {
        // Create a new review.
        const author = program.provider.wallet.publicKey;
        const review = await postReview(author, 'solana', 'gm', 1, ['go']);

        // Delete the Review.
        await program.rpc.deleteReview({
            accounts: {
                review: review.publicKey,
                author,
            },
        });

        // Ensure fetching the review account returns null.
        const reviewAccount = await program.account.review.fetchNullable(review.publicKey);
        assert.ok(reviewAccount === null);
    });

    it('cannot delete someone else\'s review', async () => {
        // Create a new review.
        const author = program.provider.wallet.publicKey;
        const review = await postReview(author, 'solana', 'gm', 1, ['run']);

        // Try to delete the Review from a different author.
        try {
            await program.rpc.deleteReview({
                accounts: {
                    review: review.publicKey,
                    author: anchor.web3.Keypair.generate().publicKey,
                },
            });
            assert.fail('We were able to delete someone else\'s review.');
        } catch (error) {
            // Ensure the review account still exists with the right data.
            const reviewAccount = await program.account.review.fetch(review.publicKey);
            assert.equal(reviewAccount.title, 'solana');
            assert.equal(reviewAccount.essay, 'gm');
        }
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