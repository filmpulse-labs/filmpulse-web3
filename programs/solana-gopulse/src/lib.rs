use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer, MintTo};

declare_id!("2M21vpK9jmHJvMs7jNZ6qeW9eQs34d4weDzzrMywDc43");

#[program]
pub mod solana_gopulse {
    use super::*;
    pub fn post_content(ctx: Context<PostContent>, title: String, essay: String, rating: i32, _author_keys: Vec<String>) -> ProgramResult {
        let content: &mut Account<Content> = &mut ctx.accounts.content;
        let author: &Signer = &ctx.accounts.author;
        let clock: Clock = Clock::get().unwrap();
        
        if title.chars().count() < 1 {
            return Err(ErrorCode::TitleRequired.into())
        }

        if title.chars().count() > 50 {
            return Err(ErrorCode::TitleTooLong.into())
        }

        if essay.chars().count() > 280 {
            return Err(ErrorCode::ReviewTooLong.into())
        }

        content.author = *author.key;
        content.timestamp = clock.unix_timestamp;
        content.title = title;
        content.essay = essay;
        content.rating = rating;

        // let authors: usize = author_keys.len();
        // let tokenDistribution: usize = 1/authors;

        // for address in author_keys {
        //     token::transfer (address: Pubkey, tokenDistribution: usize)?;
        // }

        Ok(())
    }

    pub fn verify_review(ctx: Context<VerifyReview>, review_key: Pubkey) -> ProgramResult {
        let verify: &mut Account<Verify> = &mut ctx.accounts.verify;
        let author: &Signer = &ctx.accounts.author;
        let clock: Clock = Clock::get().unwrap();

        verify.author = *author.key;
        verify.timestamp = clock.unix_timestamp;
        verify.review_key = review_key;

        // let totalSupply: u64 = 100000000;
        // let currentSupply: u64 = 21000420;
        // let notMinted: u64 = totalSupply - currentSupply;
        // let mintAmount: u64 = notMinted/totalSupply;
        // token::mint_to(author_address: Pubkey, mintAmount: u64)?;

        // let tokenDistribution: u64 = 1/verifier_keys.len();
        // for address in verifier_keys {
        //     token::transfer(address: Pubkey, tokenDistribution: u64)?;
        // }

        Ok(())
    }

    pub fn proxy_transfer(ctx: Context<ProxyTransfer>, amount: u64) -> ProgramResult {
        let new_amount = amount/2;
        token::transfer(ctx.accounts.into(), new_amount)
    }

    pub fn proxy_mint_to(ctx: Context<ProxyMintTo>, amount: u64) -> ProgramResult {
        token::mint_to(ctx.accounts.into(), amount)
    }
}

#[derive(Accounts)]
pub struct PostContent<'info> {
    #[account(init, payer = author, space = Content::LEN)]
    pub content: Account<'info, Content>,
    #[account(mut)]
    pub author: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VerifyReview<'info> {
    #[account(init, payer = author, space = Verify::LEN)]
    pub verify: Account<'info, Verify>,
    #[account(mut)]
    pub author: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ProxyTransfer<'info> {
    pub authority: Signer<'info>,
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ProxyMintTo<'info> {
    pub authority: Signer<'info>,
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct Content {
    pub author: Pubkey,
    pub timestamp: i64,
    pub title: String,
    pub essay: String,
    pub rating: i32,
}

#[account]
pub struct Verify {
    pub author: Pubkey,
    pub timestamp: i64,
    pub review_key: Pubkey,
}

const DISCRIMINATOR_LENGTH: usize = 8;
const PUBLIC_KEY_LENGTH: usize = 32;
const TIMESTAMP_LENGTH: usize = 8;
const STRING_LENGTH_PREFIX: usize = 4; // Stores the size of the string.
const MAX_TOPIC_LENGTH: usize = 50 * 4; // 50 chars max.
const MAX_CONTENT_LENGTH: usize = 280 * 4; // 280 chars max.
const REVIEW_LENGTH: usize = 32;

impl Content {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH // Author.
        + TIMESTAMP_LENGTH // Timestamp.
        + STRING_LENGTH_PREFIX + MAX_TOPIC_LENGTH // Topic.
        + STRING_LENGTH_PREFIX + MAX_CONTENT_LENGTH
        + REVIEW_LENGTH; // Content.
}

impl Verify {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH // TweetKey.
        + TIMESTAMP_LENGTH // Timestamp.
        + PUBLIC_KEY_LENGTH; // Verifier.
}

impl<'a, 'b, 'c, 'info> From<&mut ProxyTransfer<'info>>
    for CpiContext<'a, 'b, 'c, 'info, Transfer<'info>>
{
    fn from(accounts: &mut ProxyTransfer<'info>) -> CpiContext<'a, 'b, 'c, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: accounts.from.to_account_info(),
            to: accounts.to.to_account_info(),
            authority: accounts.authority.to_account_info(),
        };
        let cpi_program = accounts.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

impl<'a, 'b, 'c, 'info> From<&mut ProxyMintTo<'info>>
    for CpiContext<'a, 'b, 'c, 'info, MintTo<'info>>
{
    fn from(accounts: &mut ProxyMintTo<'info>) -> CpiContext<'a, 'b, 'c, 'info, MintTo<'info>> {
        let cpi_accounts = MintTo {
            mint: accounts.mint.to_account_info(),
            to: accounts.to.to_account_info(),
            authority: accounts.authority.to_account_info(),
        };
        let cpi_program = accounts.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

#[error]
pub enum ErrorCode {
    #[msg("The provided title should be 50 characters long maximum.")]
    TitleTooLong,
    #[msg("The provided review should be 280 characters long maximum.")]
    ReviewTooLong,
    #[msg("Topic Required.")]
    TitleRequired,
}