use hdk::{
  error::ZomeApiResult,
  holochain_core_types::{cas::content::Address, entry::Entry, json::JsonString},
};
use std::convert::TryInto;

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


pub fn response_to_address(response: JsonString) -> ZomeApiResult<Address> {
  let address_result: ZomeApiResult<Address> = response.try_into()?;
  address_result
}
