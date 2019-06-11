use hdk::{
  error::ZomeApiResult,
  holochain_core_types::{cas::content::Address, entry::Entry, json::JsonString},
  PUBLIC_TOKEN,
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

/** Proxy handlers */

pub fn set_entry_proxy(
  proxy_address: Address,
  entry_address: Option<Address>,
) -> ZomeApiResult<()> {
  let response = hdk::call(
    hdk::THIS_INSTANCE,
    "proxy",
    Address::from(PUBLIC_TOKEN.to_string()),
    "set_entry_proxy",
    json!({"proxy_address": proxy_address, "entry_address": entry_address}).into(),
  )?;

  response_to_address(response)?;
  Ok(())
}

pub fn response_to_address(response: JsonString) -> ZomeApiResult<Address> {
  let address_result: ZomeApiResult<Address> = response.try_into()?;
  address_result
}
