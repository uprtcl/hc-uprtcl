use hdk::PUBLIC_TOKEN;
use hdk::{
  entry_definition::ValidatingEntryType,
  error::ZomeApiResult,
  holochain_core_types::{
    cas::content::Address, dna::entry_types::Sharing, entry::Entry, error::HolochainError,
    json::JsonString, link::LinkMatch,
  },
};
use std::convert::TryInto;
use crate::utils;

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Lens {
  lens: String,
}

impl Lens {
  fn new(lens: String) -> Lens {
    Lens {
      lens: lens.to_owned(),
    }
  }
  fn entry(lens: String) -> Entry {
    Entry::App("lens".into(), Lens::new(lens).into())
  }
}

pub fn definition() -> ValidatingEntryType {
  entry!(
    name: "lens",
    description: "lens from which a user sees a workspace",
    sharing: Sharing::Public,
    validation_package: || {
      hdk::ValidationPackageDefinition::Entry
    },

    validation: | _validation_data: hdk::EntryValidationData<Lens>| {
      Ok(())
    },
    links: [
      from!(
        "workspace",
        link_type: "workspace_lens",
        validation_package: || {
          hdk::ValidationPackageDefinition::ChainFull
        },
        validation: |_validation_data: hdk::LinkValidationData | {
          Ok(())
        }
      ),
      from!(
        "proxy",
        link_type: "proxy_lens",
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

/** Handlers */

/**
 * Returns the lens associated with the given entry by the agent
 * If the agent has never set a lens for the entry, return the first lens that anyone
 * in the DNA linked to the entry
 */
pub fn handle_get_lens(entry_address: Address) -> ZomeApiResult<Option<Lens>> {
  let response = hdk::call(
    hdk::THIS_INSTANCE,
    "workspace",
    Address::from(PUBLIC_TOKEN.to_string()),
    "get_my_workspace",
    json!({ "entry_address": entry_address }).into(),
  )?;
  let maybe_workspace_address: ZomeApiResult<Option<Address>> = response.try_into()?;

  match maybe_workspace_address? {
    Some(workspace_address) => {
      let lenses_addresses = hdk::get_links(
        &workspace_address,
        LinkMatch::Exactly("workspace_lens"),
        LinkMatch::Any,
      )?;

      get_first_lens(lenses_addresses.addresses())
    }
    None => {
      let response = hdk::call(
        hdk::THIS_INSTANCE,
        "proxy",
        Address::from(PUBLIC_TOKEN.to_string()),
        "get_links_from_proxy",
        json!({"proxy_address": entry_address, "link_type": "proxy_lens", "tag": ""}).into(),
      )?;
      let result: ZomeApiResult<Vec<Address>> = response.try_into()?;
      let proxy_lenses = result?;

      get_first_lens(proxy_lenses)
    }
  }
}

pub fn handle_set_lens(entry_address: Address, lens: String) -> ZomeApiResult<()> {
  // Get or create entry workspace
  let response = hdk::call(
    hdk::THIS_INSTANCE,
    "workspace",
    Address::from(PUBLIC_TOKEN.to_string()),
    "get_or_create_workspace",
    json!({ "entry_address": entry_address }).into(),
  )?;

  let result: ZomeApiResult<Address> = response.try_into()?;
  let workspace_address = result?;

  // Create lens entry, if it didn't exist
  let lens_entry = Lens::entry(lens);
  let lens_address = utils::store_entry_if_new(&lens_entry)?;

  // Replace link from workspace to lens
  crate::utils::replace_links(
    &workspace_address,
    &lens_address,
    Some(String::from("workspace_lens")),
    None,
  )?;

  // Link proxy to lens
  let response = hdk::call(
    hdk::THIS_INSTANCE,
    "proxy",
    Address::from(PUBLIC_TOKEN.to_string()),
    "link_from_proxy",
    json!({"proxy_address": entry_address, "to_address": lens_address, "link_type": "proxy_lens", "tag": ""}).into(),
  )?;

  let _result: ZomeApiResult<Address> = response.try_into()?;

  Ok(())
}

/** Helpers */

fn get_first_lens(lenses_addresses: Vec<Address>) -> ZomeApiResult<Option<Lens>> {
  match lenses_addresses.len() {
    0 => Ok(None),
    _ => {
      let lens: Lens = hdk::utils::get_as_type(lenses_addresses[0].clone())?;
      Ok(Some(lens))
    }
  }
}
