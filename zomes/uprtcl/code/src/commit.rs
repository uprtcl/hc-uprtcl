use hdk::{
  entry_definition::ValidatingEntryType,
  error::ZomeApiResult,
  holochain_core_types::{
    cas::content::Address, dna::entry_types::Sharing, entry::Entry, error::HolochainError,
    json::JsonString, signature::Provenance,
  },
};
use holochain_wasm_utils::api_serialization::get_entry::{GetEntryOptions, GetEntryResult};

use crate::utils;

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Commit {
  creatorId: Address,
  message: String,
  timestamp: u128,

  // Hard links
  dataId: Address,
  parentIds: Vec<Address>,
}

impl Commit {
  pub fn get_parent_commits_addresses(self) -> Vec<Address> {
    self.parentIds
  }

  pub fn get_content_address(&self) -> &Address {
    &(self.dataId)
  }
}

pub fn definition() -> ValidatingEntryType {
  entry!(
    name: "commit",
    description: "a commit entry",
    sharing: Sharing::Public,

    validation_package: || {
      hdk::ValidationPackageDefinition::ChainFull
    },

    validation: |_validation_data: hdk::EntryValidationData<Commit>| {
      Ok(())
    }
  )
}

/** Zome exposed functions */

/**
 * Retrieves the metadata information of the commit with the given address
 */
pub fn handle_get_commit_info(commit_address: Address) -> ZomeApiResult<GetEntryResult> {
  hdk::get_entry_result(&commit_address, GetEntryOptions::default())
}

/**
 * Create a commit with the given properties,
 * and associates its previous address if present
 */
pub fn handle_create_commit(
  previous_address: Option<Address>,
  commit: Commit,
) -> ZomeApiResult<Address> {
  // TODO change for create with custom provenance
  let commit_address = utils::store_entry_if_new(&commit_entry(commit))?;

  utils::set_entry_proxy(commit_address.clone(), Some(commit_address.clone()))?;

  if let Some(proxy_address) = previous_address {
    utils::set_entry_proxy(proxy_address, Some(commit_address.clone()))?;
  }

  Ok(commit_address)
}

/** Helper functions */

fn commit_entry(commit: Commit) -> Entry {
  Entry::App("commit".into(), commit.into())
}
