use borsh::{ BorshDeserialize, BorshSerialize };
use solana_program::{
    log::sol_log_compute_units,
    account_info::{ next_account_info, AccountInfo },
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};
use std::io::ErrorKind::InvalidData;

#[derive(BorshSerialize, BorshDeserialize, Debug)] // traits
pub struct ChatMessage {
    pub archive_id: String, // archive id of arweave
    pub created_on: String // tmestamp in millisecond
}
// the actual data stored in Solana Accounts are array of ChatMessage

// example arweave tx (length 43)
// 1seRanklLU_1VTGkEk7P0xAwMJfA7owA1JHW5KyZKlY
// ReUohI9tEmXQ6EN9H9IkRjY9bSdgql_OdLUCOeMEte0
// !!! the length of the saved messages are fixed
const DUMMY_TX_ID: &str = "0000000000000000000000000000000000000000000";
const DUMMY_CREATED_ON: &str = "0000000000000000"; // milliseconds, 16 digits
pub fn get_init_chat_message() -> ChatMessage {
    ChatMessage{ archive_id: String::from(DUMMY_TX_ID), created_on: String::from(DUMMY_CREATED_ON) }
}
// !!! how many messages are predefined, Solana recommend not to change account size, due to some reason
pub fn get_init_chat_messages() -> Vec<ChatMessage> {
    let mut messages = Vec::new();
    // initialize 20 messages for testing
    for _ in 0..20 {
        messages.push(get_init_chat_message());
    }
    return messages;
}

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8]
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let account = next_account_info(accounts_iter)?;
    if account.owner != program_id {
        msg!("This account {} is not owned by this program {} and cannot be updated!", account.key, program_id);
    }

    sol_log_compute_units();
    // try to deserialize instruction data, which comes in as a binary array
    let instruction_data_message = ChatMessage::try_from_slice(instruction_data).map_err(|err| {
        // we should get rid of these log messages after testing complete, 
        // because logging also has a computation cost
        msg!("Attempt to deserialize instruction data has failed. {:?}", err);
        ProgramError::InvalidInstructionData
    })?;
    msg!("Instruction_data message object {:?}", instruction_data_message);
    // gain access to the data in the account
    // <Vec<ChatMessage>> is a dynamic array of chat messages
    // `match` is equal to `switch` in other languages
    let mut existing_data_messages = match <Vec<ChatMessage>>::try_from_slice(&account.data.borrow_mut()) {
        Ok(data) => data,
        Err(err) => {
            if err.kind() == InvalidData {
                // it's the first time create a chat message account, we need to initialize the chat messages
                msg!("InvalidData so initializing account data");
                get_init_chat_messages()
            } else {
                // panic is same as exception in other languages, 
                // in this case we don't want the program to continue so panic
                panic!("Unknown error decoding account data {:?}", err)
            }
        }
    };
    // in Rust, everyting that is iterable is also mutable
    // take the `position`, means get the index of a specific record that we found by some condition
    // this line is to find the first dummy record in the account data, and modify it
    // so if we are doing it for the first time, the index value is 0, and 1 for the second time, so on and so forth
    // as soon as we find the first record, it drop out immediately
    // and a hard `unwrap()`, potentially cause a panic, because when it fails, we don't want to continue
    let index = existing_data_messages.iter().position(|p| p.archive_id == String::from(DUMMY_TX_ID)).unwrap(); // find first dummy data entry
    msg!("Found index {}", index);
    // set the message passed through instruction data, to the corresponding position
    existing_data_messages[index] = instruction_data_message; // set dummy data to new entry

    // set messages object back to vector data
    let updated_data = existing_data_messages.try_to_vec().expect("Failed to encode data.");
    msg!("Final existing_data_messages[index] {:?}", existing_data_messages[index]);

    // data algorithm for storing data into account and then archiving into Arweave
    // 1. Each ChatMessage object will be prepopulated for txt field having 43 characters (length of a arweave tx).
    // Each ChatMessageContainer will be prepopulated with 10 ChatMessage objects with dummy data.
    // 2. Client will submit an arweave tx for each message; get back the tx id; and submit it to our program.
    // 3. This tx id will be saved to the Solana program and be used for querying back to arweave to get actual data.
    // borrow the unchanged account data, as mutable
    let data = &mut &mut account.data.borrow_mut();
    msg!("Attempting save data.");
    // we are interested only in the range ..updated_data.len(), only update data in this range
    data[..updated_data.len()].copy_from_slice(&updated_data);    
    let saved_data = <Vec<ChatMessage>>::try_from_slice(data)?;
    msg!("ChatMessage has been saved to account data. {:?}", saved_data[index]);
    sol_log_compute_units();

    msg!("End program.");
    Ok(())
}

// Sanity tests
#[cfg(test)]
mod test {
    use super::*;
    use solana_program::clock::Epoch;
    //use std::mem;

    #[test]
    fn test_sanity() {
        let program_id = Pubkey::default();
        let key = Pubkey::default();
        let mut lamports = 0;
        let messages = get_init_chat_messages(); 
        let mut data = messages.try_to_vec().unwrap();
        let owner = Pubkey::default();
        let account = AccountInfo::new(
            &key,
            false,
            true,
            &mut lamports,
            &mut data,
            &owner,
            false,
            Epoch::default(),
        );
        // pesudo data, the length 43, and 16 are fixed 
        let archive_id = "abcdefghijabcdefghijabcdefghijabcdefghijabc";
        let created_on = "0001621449453837";
        let instruction_data_chat_message = ChatMessage{ archive_id: String::from(archive_id), created_on: String::from(created_on) };
        let instruction_data = instruction_data_chat_message.try_to_vec().unwrap();

        let accounts = vec![account];

        process_instruction(&program_id, &accounts, &instruction_data).unwrap();
        let chat_messages = &<Vec<ChatMessage>>::try_from_slice(&accounts[0].data.borrow())
        .unwrap()[0]; // because a new account is created each time run this code, so the message is at index 0
        let test_archive_id = &chat_messages.archive_id;
        let test_created_on = &chat_messages.created_on;
        println!("chat message {:?}", &chat_messages);
        // I added first data and expect it to contain the given data
        // check if archive_id, and created_on is the same as passed in
        assert_eq!(
            String::from(archive_id).eq(test_archive_id),
            true
        );
        assert_eq!(
            String::from(created_on).eq(test_created_on),
            true
        );
    }
}
