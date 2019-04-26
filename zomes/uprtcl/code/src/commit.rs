use hdk::{
  entry_definition::ValidatingEntryType,
  error::ZomeApiResult,
  holochain_core_types::{
    cas::content::Address, dna::entry_types::Sharing, entry::Entry, error::HolochainError,
    json::JsonString,
  },
  AGENT_ADDRESS,
};
use holochain_wasm_utils::api_serialization::get_entry::{GetEntryOptions, GetEntryResult};
use std::convert::TryFrom;

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Commit {
  creator: Address,
  message: String,
  nonce: i32,

  // Hard links
  content_address: Address,
  parent_commits_addresses: Vec<Address>,
}

impl Commit {
  fn new(
    creator: &Address,
    message: &str,
    content_address: &Address,
    parent_commits_addresses: &Vec<Address>,
  ) -> Commit {
    Commit {
      creator: creator.to_owned(),
      message: message.to_owned(),
      nonce: 1,
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
    },

    links: []
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
 * Retrieves the contents of the commit with the given address
 */
pub fn handle_get_commit_content(commit_address: Address) -> ZomeApiResult<GetEntryResult> {
  let commit = Commit::try_from(crate::utils::get_entry_content(&commit_address)?)?;
  hdk::get_entry_result(&(commit.content_address), GetEntryOptions::default())
}

/** Helper functions */

/**
 * Creates a new commit in the given context_address with the given properties
 */
pub fn create_commit(
  message: String,
  content_address: Address,
  parent_commits: &Vec<Address>,
) -> ZomeApiResult<Address> {
  let commit_entry = Entry::App(
    "commit".into(),
    Commit::new(&AGENT_ADDRESS, &message, &content_address, parent_commits).into(),
  );

  hdk::commit_entry(&commit_entry)
}

/**
 * Merges the given commits and returns the resulting commit
 * Pre: both commits belong to the same context
 */
pub fn merge_commits(
  from_commit_address: &Address,
  to_commit_address: &Address,
  merge_commit_message: String,
) -> ZomeApiResult<Address> {
  let merge_object_address =
    crate::merge::merge_commits_contents(from_commit_address, to_commit_address)?;

  create_commit(
    merge_commit_message,
    merge_object_address,
    &vec![from_commit_address.to_owned(), to_commit_address.to_owned()],
  )
}

pub fn get_commit_history(commit_address: Address) -> ZomeApiResult<Vec<GetEntryResult>> {
  let commit: Commit = Commit::try_from(crate::utils::get_entry_content(&commit_address)?)?;

  let mut history: Vec<GetEntryResult> = commit
    .parent_commits_addresses
    .into_iter()
    .flat_map(|parent_commit_address| {
      let parent_history: Vec<GetEntryResult> = get_commit_history(parent_commit_address).unwrap();
      parent_history.into_iter()
    })
    .collect();

  history.push(handle_get_commit_info(commit_address)?);
  Ok(history)
}
