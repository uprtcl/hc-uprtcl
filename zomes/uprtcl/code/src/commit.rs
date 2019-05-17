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
  timestamp: u64,

  // Hard links
  content_link: Address,
  parent_commits_links: Vec<Address>,
}

impl Commit {
  fn new(
    creator: &Address,
    message: &str,
    timestamp: u64,
    content_link: &Address,
    parent_commits_links: &Vec<Address>,
  ) -> Commit {
    Commit {
      creator: creator.to_owned(),
      message: message.to_owned(),
      timestamp: timestamp.to_owned(),
      content_link: content_link.to_owned(),
      parent_commits_links: parent_commits_links.to_owned(),
    }
  }

  pub fn get_parent_commits_links(self) -> Vec<Address> {
    self.parent_commits_links
  }

  pub fn get_content_link(&self) -> &Address {
    &(self.content_link)
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

/** Helper functions */

fn commit_entry(commit: Commit) -> Entry {
  Entry::App("commit".into(), commit.into())
}

pub fn create_initial_commit(content_link: &Address) -> Commit {
  Commit::new(&AGENT_ADDRESS, "Initial commit", 0, content_link, &vec![])
}

/**
 * Creates a new commit in the given context_address with the given properties
 */
pub fn create_commit_entry(
  message: String,
  timestamp: u64,
  content_link: Address,
  parent_commits_links: &Vec<Address>,
) -> ZomeApiResult<Address> {
  let commit_entry = commit_entry(Commit::new(
    &AGENT_ADDRESS,
    &message,
    timestamp,
    &content_link,
    parent_commits_links,
  ));

  hdk::commit_entry(&commit_entry)
}

pub fn create_commit(commit: Commit) -> ZomeApiResult<Address> {
  let commit_entry = commit_entry(commit);
  hdk::commit_entry(&commit_entry)
}

/**
 * Computes the commit history from the given commit
 */
pub fn get_commit_history(commit_address: Address) -> ZomeApiResult<Vec<GetEntryResult>> {
  let commit: Commit = Commit::try_from(crate::utils::get_entry_content(&commit_address)?)?;

  let mut history: Vec<GetEntryResult> = commit
    .parent_commits_links
    .into_iter()
    .flat_map(|parent_commit_address| {
      let parent_history: Vec<GetEntryResult> = get_commit_history(parent_commit_address).unwrap();
      parent_history.into_iter()
    })
    .collect();

  history.push(handle_get_commit_info(commit_address)?);
  Ok(history)
}
