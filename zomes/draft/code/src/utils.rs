use hdk::{
  error::ZomeApiResult,
  holochain_core_types::{cas::content::Address, entry::Entry},
};

/**
 * Commits the given entry if it has not been commited yet, otherwise return its address
 */
pub fn commit_entry_if_missing(entry: Entry) -> ZomeApiResult<Address> {
  let entry_address = hdk::entry_address(&entry)?;
  if let None = hdk::get_entry(&entry_address)? {
    hdk::commit_entry(&entry)?;
  }

  Ok(entry_address)
}
