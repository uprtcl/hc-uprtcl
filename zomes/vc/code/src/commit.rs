use crate::tree::CommitTree;
use boolinator::Boolinator;
use hdk::{
  entry_definition::ValidatingEntryType,
  error::ZomeApiResult,
  holochain_core_types::{
    cas::content::Address,
    dna::entry_types::Sharing,
    entry::Entry,
    error::HolochainError,
    json::JsonString,
  },
  AGENT_ADDRESS,
};
use std::convert::TryFrom;

#[derive(Serialize, Deserialize, Debug, DefaultJson)]
pub struct Commit {
  author_address: Address,
  message: String,
  tree_address: Address,
  parent_commits_addresses: Vec<Address>,
}

impl Commit {
  fn new(
    author_address: &Address,
    message: &str,
    tree_address: &Address,
    parent_commits_addresses: &Vec<Address>,
  ) -> Commit {
    Commit {
      author_address: author_address.to_owned(),
      message: message.to_owned(),
      tree_address: tree_address.to_owned(),
      parent_commits_addresses: parent_commits_addresses.to_owned(),
    }
  }

  pub fn tree_address(&self) -> Address {
    self.tree_address.clone()
  }
}

pub fn definition() -> ValidatingEntryType {
  entry!(
    name: "commit",
    description: "a commit object",
    sharing: Sharing::Public,
    native_type: Commit,

    validation_package: || {
      hdk::ValidationPackageDefinition::ChainFull
    },

    validation: |commit: Commit, _ctx: hdk::ValidationData| {
      Ok(())
    },

    links: []
  )
}

pub fn create_commit(
  message: String,
  tree_address: Address,
  parent_commits: Vec<Address>,
) -> ZomeApiResult<Address> {
  let commit_entry = Entry::App(
    "commit".into(),
    Commit::new(&AGENT_ADDRESS, &message, &tree_address, &parent_commits).into(),
  );

  hdk::commit_entry(&commit_entry)
}

/**
 * Retrieves the metadata information of the commit with the given address
 */
pub fn handle_get_commit_info(commit_address: Address) -> ZomeApiResult<Option<Entry>> {
  hdk::get_entry(&commit_address)
}

/**
 * Retrieves the full contents of the commit with the given address
 */
pub fn handle_get_commit_contents(commit_address: Address) -> ZomeApiResult<Option<CommitTree>> {
  if let Some(Entry::App(_, commit_entry)) = hdk::get_entry(&commit_address)? {
    let commit = Commit::try_from(commit_entry)?;
    return crate::tree::get_tree_content(commit.tree_address);
  }

  Ok(None)
}
