use crate::utils;
use hdk::{
  entry_definition::ValidatingEntryType,
  error::ZomeApiResult,
  holochain_core_types::{
    cas::content::Address, dna::entry_types::Sharing, entry::Entry, error::HolochainError,
    json::JsonString, signature::Provenance,
  },
  AGENT_ADDRESS,
};
use holochain_wasm_utils::api_serialization::get_entry::{GetEntryOptions, GetEntryResult};

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Commit {
  creator: Address,
  message: String,
  timestamp: u128,

  // Hard links
  content_address: Address,
  parent_commits_addresses: Vec<Address>,
}

impl Commit {
  fn new(
    creator: &Address,
    message: &str,
    timestamp: u128,
    content_address: &Address,
    parent_commits_addresses: &Vec<Address>,
  ) -> Commit {
    Commit {
      creator: creator.to_owned(),
      message: message.to_owned(),
      timestamp: timestamp.to_owned(),
      content_address: content_address.to_owned(),
      parent_commits_addresses: parent_commits_addresses.to_owned(),
    }
  }

  pub fn get_parent_commits_addresses(self) -> Vec<Address> {
    self.parent_commits_addresses
  }

  pub fn get_content_address(&self) -> &Address {
    &(self.content_address)
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
 * Handles the creation of a commit: store all the contents of the commit
 * Call update_perspective_head with the resulting commit to set it as its head
 */
pub fn handle_create_commit(
  message: String,
  timestamp: u128,
  parent_commits_addresses: Vec<Address>,
  content_address: Address,
) -> ZomeApiResult<Address> {
  let commit = Commit::new(
    &AGENT_ADDRESS,
    &message,
    timestamp,
    &content_address,
    &parent_commits_addresses,
  );

  let commit_address = hdk::commit_entry(&commit_entry(commit))?;
  utils::set_entry_proxy(commit_address.clone(), Some(commit_address.clone()))?;

  Ok(commit_address)
}

/**
 * Clones the given commit in the source chain
 */
pub fn handle_clone_commit(
  address: Option<Address>,
  commit: Commit,
  provenance: Provenance,
) -> ZomeApiResult<Address> {
  let commit_address =
    utils::commit_entry_with_custom_provenance(&commit_entry(commit), provenance)?;

  crate::utils::set_entry_proxy(commit_address.clone(), Some(commit_address.clone()))?;

  if let Some(proxy_address) = address {
    utils::set_entry_proxy(proxy_address, Some(commit_address.clone()))?;
  }

  Ok(commit_address)
}

/** Helper functions */

fn commit_entry(commit: Commit) -> Entry {
  Entry::App("commit".into(), commit.into())
}
