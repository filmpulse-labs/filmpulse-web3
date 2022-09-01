import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { SolanaGopulse } from '../target/types/solana_gopulse';
import * as assert from "assert";
import * as bs58 from "bs58";
import * as serumCmn from "@project-serum/common";
import { TokenInstructions } from  "@project-serum/serum";

describe('solana-gopulse', () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.Provider.env());
    const program = anchor.workspace.SolanaGopulse as Program<SolanaGopulse>;
    const postContent = async (author, primaryTag, primaryContent, amount, theKeys) => {
        const content = anchor.web3.Keypair.generate();
        await program.rpc.postV0(primaryTag, primaryContent, amount, {
            accounts: {
                content: content.publicKey,
                author,
                to,
                from,
                tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
            },
            remainingAccounts: theKeys,
            signers: [content],
        });
        return content
    }

    let mint = null;
    let from = null;
    let from2 = null;
    let to = null;
  
    it("Initialize test state", async () => {
      mint = await createMint(program.provider);
      from = await createTokenAccount(program.provider, mint, program.provider.wallet.publicKey);
      to = await createTokenAccount(program.provider, mint, program.provider.wallet.publicKey);
    });
  
    it("Mint tokens", async () => {
      await program.rpc.proxyMintTo(new anchor.BN(10000), {
        accounts: {
          authority: program.provider.wallet.publicKey,
          mint,
          to: from,
          tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
        },
      });
      const fromAccount = await program.provider.connection.getTokenAccountBalance(from);
      assert.equal(fromAccount.value.amount, new anchor.BN(10000));
    });

    it('Post new content', async () => {
        let content;
        let contentAccounts = await program.account.content.all();
        for (let index = 0; index < 10; index++) {
            content = anchor.web3.Keypair.generate();
            await program.rpc.postV0('dune', 'a good review', new anchor.BN(100), {
                accounts: {
                    content: content.publicKey,
                    author: program.provider.wallet.publicKey,
                    to,
                    from,
                    tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
                    systemProgram: anchor.web3.SystemProgram.programId,
                },
                remainingAccounts: contentAccounts,
                signers: [content],
            });
        }

        // Fetch the account details of the created content.
        const contentAccount = await program.account.content.fetch(content.publicKey);

        contentAccounts = await program.account.content.all();

        const fromAccount = await program.provider.connection.getTokenAccountBalance(from);
        const toAccount = await program.provider.connection.getTokenAccountBalance(to);

        // Ensure it has the right data.
        assert.equal(contentAccount.author.toBase58(), program.provider.wallet.publicKey.toBase58());
        assert.equal(contentAccount.title, 'dune');
        assert.equal(contentAccount.essay, 'a good review');
        assert.equal(fromAccount.value.amount, new anchor.BN(9000));
        assert.equal(toAccount.value.amount, new anchor.BN(1000));
        assert.ok(contentAccount.timestamp);
    });

    it('Post content from a different author', async () => {
        const otherUser = anchor.web3.Keypair.generate();
        const signature = await program.provider.connection.requestAirdrop(otherUser.publicKey, 1000000000);
        await program.provider.connection.confirmTransaction(signature);

        from2 = await createTokenAccount(program.provider, mint, otherUser.publicKey);

        await program.rpc.proxyMintTo(new anchor.BN(1000), {
            accounts: {
              authority: program.provider.wallet.publicKey,
              mint,
              to: from2,
              tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
            },
        });

        const content = anchor.web3.Keypair.generate();
        await program.rpc.postV0('taxi-driver', 'Yay taxis', new anchor.BN(100), {
            accounts: {
                content: content.publicKey,
                author: otherUser.publicKey,
                from: from2,
                to,
                tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
            },
            signers: [otherUser, content],
        });

        const contentAccount = await program.account.content.fetch(content.publicKey);

        // Ensure it has the right data.
        assert.equal(contentAccount.author.toBase58(), otherUser.publicKey.toBase58());
        assert.equal(contentAccount.title, 'taxi-driver');
        assert.equal(contentAccount.essay, 'Yay taxis');
        assert.ok(contentAccount.timestamp);
    });

    it('Post content again', async () => {
        const contentAccounts = await program.account.content.all();
        const content = anchor.web3.Keypair.generate();
        await program.rpc.postV0('dune', 'another good review', new anchor.BN(100), {
            accounts: {
                content: content.publicKey,
                author: program.provider.wallet.publicKey,
                to,
                from,
                tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
            },
            signers: [content],
        });

        // Fetch the account details of the created tweet.
        const contentAccount = await program.account.content.fetch(content.publicKey);

        // Ensure it has the right data.
        assert.equal(contentAccount.author.toBase58(), program.provider.wallet.publicKey.toBase58());
        assert.equal(contentAccount.title, 'dune');
        assert.equal(contentAccount.essay, 'another good review');
        assert.ok(contentAccount.timestamp);
    });

    it('Fetch all content accounts', async () => {
        const reviewAccounts = await program.account.content.all();
        assert.equal(reviewAccounts.length, 12);
    });

    it('Validate content', async () => {
        const contentAccounts = await program.account.content.all();
        let theKey = contentAccounts[0].publicKey;
        const verify = anchor.web3.Keypair.generate();
        await program.rpc.validateV0(new anchor.BN(100), {
            accounts: {
                verify: verify.publicKey,
                author: program.provider.wallet.publicKey,
                key: theKey,
                to,
                from,
                tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
            },
            signers: [verify],
        });

        const validateAccount = await program.account.verify.fetch(verify.publicKey);
    });

    it('Filter content accounts by author', async () => {
        const authorPublicKey = program.provider.wallet.publicKey
        const reviewAccounts = await program.account.content.all([
            {
                memcmp: {
                    offset: 8, // Discriminator.
                    bytes: authorPublicKey.toBase58(),
                }
            }
        ]);

        assert.equal(reviewAccounts.length, 11);
        assert.ok(reviewAccounts.every(reviewAccount => {
            return reviewAccount.account.author.toBase58() === authorPublicKey.toBase58()
        }))
    });

    it('Filter content accounts by topic', async () => {
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

        assert.equal(reviewAccounts.length, 11);
        assert.ok(reviewAccounts.every(reviewAccount => {
            return reviewAccount.account.title === 'dune'
        }))
    });
});
  
  // SPL token client boilerplate for test initialization. Everything below here is
  // mostly irrelevant to the point of the example.
  // TODO: remove this constant once @project-serum/serum uses the same version
  //       of @solana/web3.js as anchor (or switch packages).
  const program = anchor.workspace.SolanaGopulse as Program<SolanaGopulse>;

  const TOKEN_PROGRAM_ID = new anchor.web3.PublicKey(
    TokenInstructions.TOKEN_PROGRAM_ID.toString()
  );
  
  async function getTokenAccount(provider, addr) {
    return await serumCmn.getTokenAccount(provider, addr);
  }
  
  async function getMintInfo(provider, mintAddr) {
    return await serumCmn.getMintInfo(provider, mintAddr);
  }
  
  async function createMint(provider, authority) {
    if (authority === undefined) {
      authority = provider.wallet.publicKey;
    }
    const mint = anchor.web3.Keypair.generate();
    const instructions = await createMintInstructions(
      provider,
      authority,
      mint.publicKey
    );
  
    const tx = new anchor.web3.Transaction();
    tx.add(...instructions);
  
    await provider.send(tx, [mint]);
  
    return mint.publicKey;
  }
  
  async function createMintInstructions(provider, authority, mint) {
    let instructions = [
      anchor.web3.SystemProgram.createAccount({
        fromPubkey: provider.wallet.publicKey,
        newAccountPubkey: mint,
        space: 82,
        lamports: await provider.connection.getMinimumBalanceForRentExemption(82),
        programId: TOKEN_PROGRAM_ID,
      }),
      TokenInstructions.initializeMint({
        mint,
        decimals: 9,
        mintAuthority: authority,
      }),
    ];
    return instructions;
  }
  
  async function createTokenAccount(provider, mint, owner) {
    const vault = anchor.web3.Keypair.generate();
    const tx = new anchor.web3.Transaction();
    tx.add(
      ...(await createTokenAccountInstrs(program.provider, vault.publicKey, mint, owner))
    );
    await provider.send(tx, [vault]);
    return vault.publicKey;
  }
  
  async function createTokenAccountInstrs(
    provider,
    newAccountPubkey,
    mint,
    owner,
    lamports
  ) {
    if (lamports === undefined) {
      lamports = await provider.connection.getMinimumBalanceForRentExemption(165);
    }
    return [
      anchor.web3.SystemProgram.createAccount({
        fromPubkey: provider.wallet.publicKey,
        newAccountPubkey,
        space: 165,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      }),
      TokenInstructions.initializeAccount({
        account: newAccountPubkey,
        mint,
        owner,
      }),
    ];
  }

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