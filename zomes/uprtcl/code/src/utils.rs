use hdk::{
  error::{ZomeApiError, ZomeApiResult},
  holochain_core_types::{
    cas::content::{Address, Content},
    entry::Entry,
    link::LinkMatch,
    signature::Provenance,
  },
  holochain_wasm_utils::api_serialization::commit_entry::CommitEntryOptions,
  PUBLIC_TOKEN,
};
use holochain_wasm_utils::api_serialization::get_links::GetLinksResult;
use std::convert::TryInto;

/**
 * Stores the given entry in the DHT if it didn't exist before,
 * otherwise return its address
 */
pub fn store_entry_if_new(entry: &Entry) -> ZomeApiResult<Address> {
  let entry_address = hdk::entry_address(entry)?;

  match hdk::get_entry(&entry_address)? {
    Some(_) => Ok(entry_address),
    None => hdk::commit_entry(entry),
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
) -> ZomeApiResult<()> {
  let response = hdk::call(
    hdk::THIS_INSTANCE,
    "proxy",
    Address::from(PUBLIC_TOKEN.to_string()),
    "set_entry_proxy",
    json!({"proxy_address": proxy_address, "entry_address": entry_address}).into(),
  )?;

  let _result: ZomeApiResult<Address> = response.try_into()?;
  let _address: Address = _result?;

  Ok(())
}

/**
 * Returns the links associated with the given parameters
 */
pub fn get_links(
  base_address: &Address,
  link_option: Option<String>,
  tag_option: Option<String>,
) -> ZomeApiResult<GetLinksResult> {
  // Create long lived strings to hold the value of LinkMatch
  let mut _string1 = String::new();
  let mut _string2 = String::new();
  let link_type = match link_option {
    None => LinkMatch::Any,
    Some(link_string) => {
      _string1 = link_string.to_string();
      LinkMatch::Exactly(_string1.as_str())
    }
  };
  let tag = match tag_option {
    None => LinkMatch::Any,
    Some(tag_string) => {
      _string2 = tag_string.to_string();
      LinkMatch::Exactly(_string2.as_str())
    }
  };

  hdk::get_links(base_address, link_type, tag)
}

pub fn remove_previous_links(
  base_address: &Address,
  link_option: Option<String>,
  tag_option: Option<String>,
) -> ZomeApiResult<()> {
  let previous_links = get_links(base_address, link_option.clone(), tag_option.clone())?;

  for previous_link in previous_links.addresses() {
    hdk::remove_link(
      base_address,
      &previous_link,
      option_to_string(link_option.clone()),
      option_to_string(tag_option.clone()),
    )?;
  }

  Ok(())
}

/**
 * Replaces the links with the given options to any address that existed previously,
 * and creates a new one to the given new_to_address
 */
pub fn replace_links(
  base_address: &Address,
  new_to_address: &Address,
  link_option: Option<String>,
  tag_option: Option<String>,
) -> ZomeApiResult<Address> {
  remove_previous_links(&base_address, link_option.clone(), tag_option.clone())?;

  hdk::link_entries(
    base_address,
    new_to_address,
    option_to_string(link_option),
    option_to_string(tag_option),
  )
}

fn option_to_string(link_option: Option<String>) -> String {
  match link_option {
    Some(link) => link,
    None => String::from(""),
  }
}
