use anchor_lang::prelude::*;
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

    pub fn make_post(ctx: Context<MakePost>) -> ProgramResult {


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

pub struct MakePost<'info> {
    #[account(mut, has_one=authority)]
    pub blog_account: Account<'info, BlogAccount>,
    pub authority: Signer<'info>,
}

#[account]
pub struct BlogAccount {
    pub latest_post: u64,
    pub authority: Pubkey,
}
