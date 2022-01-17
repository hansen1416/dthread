use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    // log::sol_log_compute_units,
    msg,
    // program_error::ProgramError,
    pubkey::Pubkey,
};

/// Define the type of state stored in accounts
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct DataAccount {
    /// number of greetings
    pub id: String,
}

// Declare and export the program's entrypoint
entrypoint!(process_instruction);

// Program entrypoint's implementation
pub fn process_instruction(
    _program_id: &Pubkey, // Public key of the account the hello world program was loaded into
    accounts: &[AccountInfo], // The account to say hello to
    _instruction_data: &[u8], // Ignored, all helloworld instructions are hellos
) -> ProgramResult {
    msg!("start transfer lamports");
    // Create an iterator to safely reference accounts in the slice
    let account_info_iter = &mut accounts.iter();
    let tt = account_info_iter.len();
    let sh = 10;
    let wd = sh * (tt - 1) as u64;

    msg!("total accounts {}, share {}, total lamports {}", tt, sh, wd);

    for i in 0..tt {
        // todo check duplicates
        if i == 0 {
            // As part of the program specification the first account is the source account
            // the other accounts are the destination accounts
            let source_info = next_account_info(account_info_iter)?;

            // Withdraw five lamports from the source
            **source_info.try_borrow_mut_lamports()? -= wd;
        } else {
            let destination_info = next_account_info(account_info_iter)?;
            // Deposit five lamports into the destination
            **destination_info.try_borrow_mut_lamports()? += sh;
        }
    }

    msg!("finish transfer lamports");

    Ok(())
}

// #[tokio::test]
// async fn test_lamport_transfer() {
//     let program_id = Pubkey::from_str("TransferLamports111111111111111111111111111").unwrap();
//     let source_pubkey = Pubkey::new_unique();
//     let destination_pubkey = Pubkey::new_unique();
//     let mut program_test = ProgramTest::new(
//         "spl_example_transfer_lamports",
//         program_id,
//         processor!(process_instruction),
//     );
//     program_test.add_account(
//         source_pubkey,
//         Account {
//             lamports: 5,
//             owner: program_id, // Can only withdraw lamports from accounts owned by the program
//             ..Account::default()
//         },
//     );
//     program_test.add_account(
//         destination_pubkey,
//         Account {
//             lamports: 5,
//             ..Account::default()
//         },
//     );
//     let (mut banks_client, payer, recent_blockhash) = program_test.start().await;

//     let mut transaction = Transaction::new_with_payer(
//         &[Instruction::new_with_bincode(
//             program_id,
//             &(),
//             vec![
//                 AccountMeta::new(source_pubkey, false),
//                 AccountMeta::new(destination_pubkey, false),
//             ],
//         )],
//         Some(&payer.pubkey()),
//     );
//     transaction.sign(&[&payer], recent_blockhash);
//     banks_client.process_transaction(transaction).await.unwrap();
// }
