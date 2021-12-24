use anchor_lang::prelude::*;
use std::str::from_utf8;

// our program id
declare_id!("9q8k2mjwj2BMN9CePzVd2pFNjCWv5i8JzhiYUWiyJrPm");

#[program]
pub mod blog_tutorial {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
        let blog_acc = &mut ctx.accounts.blog_account;
        blog_acc.authority = *ctx.accounts.authority.key;
        Ok(())
    }

    pub fn make_post(ctx: Context<MakePost>, new_post: Vec<u8>) -> ProgramResult {
        // post
        let post = from_utf8(&new_post).map_err(|err| {
            msg!("Invalid UTF-8, from byte {}", err.valid_up_to());
            ProgramError::InvalidInstructionData
        })?;

        msg!(post);

        let blog_acc = &mut ctx.accounts.blog_account;
        blog_acc.latest_post = new_post;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer=authority,
        space = 8 // for account discreminator
        + 32 // for pubkey
        + 566 // make the posts max 566 bytes long
    )]
    pub blog_account: Account<'info, BlogAccount>,
    // #[account(mut)]
    pub authority: Signer<'info>,//
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MakePost<'info> {
    #[account(mut, 
        has_one=authority )]
    pub blog_account: Account<'info, BlogAccount>,
    pub authority: Signer<'info>,
}

#[account]
pub struct BlogAccount {
    pub latest_post: Vec<u8>,
    pub authority: Pubkey,
}
