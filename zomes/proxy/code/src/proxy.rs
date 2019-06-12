use hdk::{
  entry_definition::ValidatingEntryType,
  error::ZomeApiResult,
  holochain_core_types::{
    cas::content::Address, dna::entry_types::Sharing, entry::Entry, error::HolochainError,
    json::JsonString, link::LinkMatch,
  },
};
use holochain_wasm_utils::api_serialization::get_entry::{
  GetEntryOptions, GetEntryResult, StatusRequestKind,
};

use crate::utils;

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Proxy {
  proxy_address: Address,
}

impl Proxy {
  fn new(proxy_address: Address) -> Proxy {
    Proxy {
      proxy_address: proxy_address.to_owned(),
    }
  }
  fn entry(proxy_address: Address) -> Entry {
    Entry::App("proxy".into(), Proxy::new(proxy_address).into())
  }
}

pub fn definition() -> ValidatingEntryType {
  entry!(
    name: "proxy",
    description: "proxy to substitute any entry that wouldn't be present in the hApp",
    sharing: Sharing::Public,
    validation_package: || {
      hdk::ValidationPackageDefinition::Entry
    },

    validation: | _validation_data: hdk::EntryValidationData<Proxy>| {
      Ok(())
    },
    links: [
      to!(
        "proxy",
        link_type: "external_proxy",
        validation_package: || {
          hdk::ValidationPackageDefinition::ChainFull
        },
        validation: |_validation_data: hdk::LinkValidationData | {
          Ok(())
        }
      ),
      to!(
        "proxy",
        link_type: "internal_proxy",
        validation_package: || {
          hdk::ValidationPackageDefinition::ChainFull
        },
        validation: |_validation_data: hdk::LinkValidationData | {
          Ok(())
        }
      )
    ]
  )
}

/** Exposed zome functions */

/**
 * Sets the given proxy pointing to the given address
 */
pub fn handle_set_entry_proxy(
  proxy_address: Address,
  entry_address: Option<Address>,
) -> ZomeApiResult<Address> {
  // Store the given proxy as an entry
  let proxy_entry_address = utils::store_entry_if_new(&Proxy::entry(proxy_address.clone()))?;

  if let Some(address) = entry_address {
    if proxy_address != address {
      // We are setting an external proxy: set the internal and setup the links
      let internal_proxy_entry_address =
        utils::store_entry_if_new(&Proxy::entry(address.to_owned()))?;
      hdk::link_entries(
        &proxy_entry_address,
        &internal_proxy_entry_address,
        "internal_proxy",
        "",
      )?;
      hdk::link_entries(
        &internal_proxy_entry_address,
        &proxy_entry_address,
        "external_proxy",
        "",
      )?;
    }
  }

  Ok(proxy_entry_address)
}

/**
 * Returns the entry identified by the given address if it exists in the hApp
 */
pub fn handle_get_proxied_entry(address: Address) -> ZomeApiResult<GetEntryResult> {
  let maybe_entry = get_entry_result(&address)?;

  if maybe_entry.found() {
    return Ok(maybe_entry);
  }

  let proxy_entry_address = proxy_entry_address(address)?;

  match hdk::get_entry(&proxy_entry_address)? {
    None => entry_not_found(),
    Some(_) => {
      // We have stored the proxy for the given address
      let links = hdk::get_links(
        &proxy_entry_address,
        LinkMatch::Exactly("internal_proxy"),
        LinkMatch::Any,
      )?;
      match links.addresses().len() {
        1 => {
          let internal_proxy_entry: Proxy = hdk::utils::get_as_type(links.addresses()[0].clone())?;
          get_entry_result(&internal_proxy_entry.proxy_address)
        }
        _ => entry_not_found(),
      }
    }
  }
}

/** Create link */

/**
 * Links the given base entry to the proxy identified by the proxy_address
 */
pub fn handle_link_to_proxy(
  base_address: Address,
  proxy_address: Address,
  link_type: String,
  tag: String,
) -> ZomeApiResult<Address> {
  let proxy_entry_address = proxy_entry_address(proxy_address)?;
  hdk::link_entries(&base_address, &proxy_entry_address, link_type, tag)
}

/**
 * Links the proxy identified by the proxy_address to the given base entry
 */
pub fn handle_link_from_proxy(
  proxy_address: Address,
  to_address: Address,
  link_type: String,
  tag: String,
) -> ZomeApiResult<Address> {
  let proxy_entry_address = proxy_entry_address(proxy_address)?;
  hdk::link_entries(&proxy_entry_address, &to_address, link_type, tag)
}

/** Remove link */

pub fn handle_remove_link_to_proxy(
  base_address: Address,
  proxy_address: Address,
  link_type: String,
  tag: String,
) -> ZomeApiResult<()> {
  let proxy_entry_address = proxy_entry_address(proxy_address)?;
  hdk::remove_link(&base_address, &proxy_entry_address, link_type, tag)
}

/**
 * Links the proxy identified by the proxy_address to the given base entry
 */
pub fn handle_remove_link_from_proxy(
  proxy_address: Address,
  to_address: Address,
  link_type: String,
  tag: String,
) -> ZomeApiResult<()> {
  let proxy_entry_address = proxy_entry_address(proxy_address)?;
  hdk::remove_link(&proxy_entry_address, &to_address, link_type, tag)
}

/** Get links */

/**
 * Get all links from the given proxy address and the proxies that represent the same identity
 */
pub fn handle_get_links_from_proxy(
  proxy_address: Address,
  link_type: Option<String>,
  tag: Option<String>,
) -> ZomeApiResult<Vec<Address>> {
  let proxy_entry_address = proxy_entry_address(proxy_address.clone())?;

  let internal_proxy_links = hdk::get_links(
    &proxy_entry_address,
    LinkMatch::Exactly("internal_proxy"),
    LinkMatch::Any,
  )?;

  match internal_proxy_links.addresses().len() {
    1 => get_links_from_internal_proxy(internal_proxy_links.addresses()[0].clone(), link_type, tag),
    _ => get_links_from_internal_proxy(proxy_entry_address, link_type, tag),
  }
}

/**
 * Get all links from the given internal proxy address plus all the links from the external proxies associated with it
 */
fn get_links_from_internal_proxy(
  internal_proxy_entry_address: Address,
  link_type: Option<String>,
  tag: Option<String>,
) -> ZomeApiResult<Vec<Address>> {
  let internal_proxy_links = utils::get_links(
    &internal_proxy_entry_address,
    link_type.clone(),
    tag.clone(),
  )?;

  let mut links: Vec<Address> = internal_proxy_links.addresses();

  let external_proxies_addresses = hdk::get_links(
    &internal_proxy_entry_address,
    LinkMatch::Exactly("external_proxy"),
    LinkMatch::Any,
  )?;

  for external_proxy_address in external_proxies_addresses.addresses() {
    let external_proxy_links =
      utils::get_links(&external_proxy_address, link_type.clone(), tag.clone())?;
    links.append(&mut external_proxy_links.addresses());
  }

  Ok(links)
}

/**
 * Returns all the links from the given base address to proxies addresses
 */
pub fn handle_get_links_to_proxy(
  base_address: Address,
  link_type: Option<String>,
  tag: Option<String>,
) -> ZomeApiResult<Vec<Address>> {
  let proxy_entries_addresses = utils::get_links(&base_address, link_type, tag)?;

  let mut proxy_addresses: Vec<Address> = Vec::new();

  for proxy_address in proxy_entries_addresses.addresses().into_iter() {
    let proxy_entry: Proxy = hdk::utils::get_as_type(proxy_address)?;
    proxy_addresses.push(proxy_entry.proxy_address);
  }

  Ok(proxy_addresses)
}

/** Helpers */

fn get_entry_result(address: &Address) -> ZomeApiResult<GetEntryResult> {
  hdk::get_entry_result(
    address,
    GetEntryOptions {
      status_request: StatusRequestKind::default(),
      entry: true,
      headers: true,
      timeout: Default::default(),
    },
  )
}

fn entry_not_found() -> ZomeApiResult<GetEntryResult> {
  Ok(GetEntryResult::new(StatusRequestKind::default(), None))
}

fn proxy_entry_address(proxy_address: Address) -> ZomeApiResult<Address> {
  hdk::entry_address(&Proxy::entry(proxy_address))
}
