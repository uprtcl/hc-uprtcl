use hdk::{
  error::{ZomeApiError, ZomeApiResult},
  holochain_core_types::{
    cas::content::{Address, Content},
    entry::Entry,
    json::JsonString,
    signature::Provenance,
  },
  holochain_wasm_utils::api_serialization::commit_entry::CommitEntryOptions,
  DNA_ADDRESS, PUBLIC_TOKEN,
};
use std::convert::TryInto;

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

pub fn get_origin() -> String {
  String::from("holochain://") + &String::from(DNA_ADDRESS.to_owned())
}

/**
 * Commits the given entry with the given custom provenance
 */
pub fn commit_entry_with_custom_provenance(
  entry: &Entry,
  provenance: Provenance,
) -> ZomeApiResult<Address> {
  let options = CommitEntryOptions::new(vec![provenance]);

  let entry_result = hdk::commit_entry_result(entry, options)?;
  Ok(entry_result.address())
}

/** Proxy handlers */

pub fn set_entry_proxy(
  proxy_address: Address,
  entry_address: Option<Address>,
) -> ZomeApiResult<Address> {
  let args = json!({"proxy_address": proxy_address, "entry_address": entry_address});

  let response = hdk::call(
    hdk::THIS_INSTANCE,
    "proxy",
    Address::from(PUBLIC_TOKEN.to_string()),
    "set_entry_proxy",
    args.into(),
  )?;

  let result: ZomeApiResult<Address> = response.try_into()?;

  result
}
