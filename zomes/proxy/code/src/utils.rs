use hdk::{
  error::{ZomeApiError, ZomeApiResult},
  holochain_core_types::{
    cas::content::{Address, Content},
    entry::Entry,
    signature::Provenance,
  },
  holochain_wasm_utils::api_serialization::commit_entry::CommitEntryOptions,
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
