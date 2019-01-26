
use hdk::{
  error::{ZomeApiError, ZomeApiResult},
  
  holochain_core_types::{
    cas::content::{Address, Content},
    entry::Entry,
  },
};

/**
 * Stores the given entry in the DHT if it didn't exist before, 
 * otherwise return its address
 */
pub fn store_entry_if_new(entry: Entry) -> ZomeApiResult<Address> {
  let entry_address = hdk::entry_address(&entry)?;

  match hdk::get_entry(&entry_address)? {
    Some(_) => Ok(entry_address),
    None => hdk::commit_entry(&entry),
  }
}

/**
 * Gets the entry from the DHT if it exists, returns error otherwise
 */
pub fn get_entry_content(entry_address: &Address) -> ZomeApiResult<Content> {
  match hdk::get_entry(entry_address)? {
    Some(Entry::App(_, entry)) => Ok(entry),
    _ => Err(ZomeApiError::from(String::from("entry does not exist"))),
  }
}
