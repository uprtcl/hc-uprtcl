use hdk::{holochain_core_types::{
  cas::content::Address, dna::entry_types::Sharing, entry::Entry, error::HolochainError,
  json::JsonString,
}, PUBLIC_TOKEN, entry_definition::ValidatingEntryType, error::ZomeApiResult, DNA_ADDRESS};
use holochain_wasm_utils::api_serialization::get_entry::GetEntryResult;
use std::convert::TryInto;
use crate::utils;

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Source {
  pub source: String,
}

impl Source {
  pub fn new(source: String) -> Source {
    Source {
      source: source.to_owned(),
    }
  }
}

pub fn definition() -> ValidatingEntryType {
  entry!(
      name: "source",
      description: "represents an external source from which to retrieve addresses",
      sharing: Sharing::Public,
      validation_package: || {
          hdk::ValidationPackageDefinition::Entry
      },

      validation: | _validation_data: hdk::EntryValidationData<Source>| {
          Ok(())
      },
      links: [
        from!(
          "proxy",
          link_type: "known_source",
          validation_package: || {
            hdk::ValidationPackageDefinition::ChainFull
          },
          validation: | _validation_data: hdk::LinkValidationData | {
            Ok(())
          }
        )
      ]
  )
}

/** Public handlers */
pub fn handle_get_own_source() -> ZomeApiResult<String> {
  Ok(String::from("holochain://") + &String::from(DNA_ADDRESS.to_owned()))
}

/**
 * Returns the known sources for the given address, as following:
 * - If we have the entry in our app, return our own source
 * - If we have stored the proxy and know the source, return that source,
 * - Otherwise, return empty vector 
 */
pub fn handle_get_known_sources(address: Address) -> ZomeApiResult<Vec<String>> {
  match proxied_entry_exists(&address)? {
    true => Ok(vec![handle_get_own_source()?]),
    false => {
      let response = hdk::call(
        hdk::THIS_INSTANCE,
        "proxy",
        Address::from(PUBLIC_TOKEN.to_string()),
        "get_links_from_proxy",
        json!({"proxy_address": address, "link_type": "known_source", "tag": ""}).into(),
      )?;

      let links_result: ZomeApiResult<Vec<Address>> = response.try_into()?;
      let links_addresses = links_result?;

      let mut sources: Vec<String> = Vec::new();
      for source_address in links_addresses.into_iter() {
        let source_entry: Source = hdk::utils::get_as_type(source_address)?;
        sources.push(source_entry.source);
      }

      Ok(sources)
    }
  }
}

/**
 * Add the given source to the list of known source for the given address
 */
pub fn handle_add_known_sources(address: Address, sources: Vec<String>) -> ZomeApiResult<()> {
  utils::set_entry_proxy(address.clone(), None)?;

  for source in sources.into_iter() {
    let source_address = create_source(source)?;

    let response = hdk::call(
        hdk::THIS_INSTANCE,
        "proxy",
        Address::from(PUBLIC_TOKEN.to_string()),
        "link_from_proxy",
        json!({"proxy_address": address.clone(), "to_address": source_address.clone(), "link_type": "known_source", "tag": ""}).into(),
      )?;

    // Check that response from proxy zome is ok
    let _result: ZomeApiResult<Address> = response.try_into()?;
    let _address = _result?;
  }
  Ok(())
}

/**
 * Remove the given source from the list of known sources for the given address
 */
pub fn handle_remove_known_sources(address: Address, source: String) -> ZomeApiResult<()> {
  let source_address = source_address(source)?;

  let response = hdk::call(
        hdk::THIS_INSTANCE,
        "proxy",
        Address::from(PUBLIC_TOKEN.to_string()),
        "remove_link_from_proxy",
        json!({"proxy_address": address.clone(), "to_address": source_address.clone(), "link_type": "known_source", "tag": ""}).into(),
      )?;

  // Check that response from proxy zome is ok
  response.try_into()?
}

/** Helper functions */

fn source_entry(source: String) -> Entry {
  Entry::App("source".into(), Source::new(source).into())
}

fn source_address(source: String) -> ZomeApiResult<Address> {
  hdk::entry_address(&source_entry(source))
}

fn create_source(source: String) -> ZomeApiResult<Address> {
  hdk::commit_entry(&source_entry(source))
}

fn proxied_entry_exists(address: &Address) -> ZomeApiResult<bool> {
  let response = hdk::call(
        hdk::THIS_INSTANCE,
        "proxy",
        Address::from(PUBLIC_TOKEN.to_string()),
        "get_proxied_entry",
        json!({"address": address.clone()}).into(),
      )?;

  // Check that response from proxy zome is ok
  let result: ZomeApiResult<GetEntryResult> = response.try_into()?;
  let entry_result = result?;

  Ok(entry_result.found())
}