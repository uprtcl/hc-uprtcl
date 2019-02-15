use crate::object::Object;
use boolinator::Boolinator;
use hdk::{
  entry_definition::ValidatingEntryType,
  error::ZomeApiResult,
  holochain_core_types::{
    cas::content::Address, dna::entry_types::Sharing, entry::Entry, error::HolochainError,
    json::JsonString,
  },
  AGENT_ADDRESS,
};
use std::convert::TryFrom;
use holochain_wasm_utils::api_serialization::get_entry::{GetEntryResult,GetEntryOptions};

#[derive(Serialize, Deserialize, Debug, DefaultJson)]
pub struct Commit {
  context_address: Address,

  author_address: Address,
  message: String,
  // Content can point to a tree or a blob
  object_address: Address,
  parent_commits_addresses: Vec<Address>,
}

impl Commit {
  fn new(
    context_address: &Address,
    author_address: &Address,
    message: &str,
    object_address: &Address,
    parent_commits_addresses: &Vec<Address>,
  ) -> Commit {
    Commit {
      context_address: context_address.to_owned(),
      author_address: author_address.to_owned(),
      message: message.to_owned(),
      object_address: object_address.to_owned(),
      parent_commits_addresses: parent_commits_addresses.to_owned(),
    }
  }

  pub fn get_parent_commits_addresses(self) -> Vec<Address> {
    self.parent_commits_addresses
  }

  pub fn get_object_address(&self) -> &Address {
    &(self.object_address)
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
  hdk::get_entry_result(&(commit.object_address), GetEntryOptions::default())
  /*
  Useful when full commit contents should be retrieved, to iterate deep into the tree

  if let Some(Entry::App(_, content_entry)) = hdk::get_entry(&commit.object_address)? {
    match Blob::try_from(content_entry) {
      Ok(blob) => Ok(Some(CommitContent::ContentBlob(blob))) as ZomeApiResult<Option<CommitContent>>,
      Err(_) => Ok(Some(CommitContent::ContentTree(Tree::try_from(
        content_entry,
      )?))),
    };
  } */
}

/** Helper functions */

/**
 * Creates a new commit in the given context_address with the given properties
 */
pub fn create_commit(
  context_address: Address,
  message: String,
  object_address: Address,
  parent_commits: &Vec<Address>,
) -> ZomeApiResult<Address> {
  let commit_entry = Entry::App(
    "commit".into(),
    Commit::new(
      &context_address,
      &AGENT_ADDRESS,
      &message,
      &object_address,
      parent_commits,
    )
    .into(),
  );

  hdk::commit_entry(&commit_entry)
}

/**
 * Gets the commit and returns its context address
 */
pub fn get_context_address(commit_address: &Address) -> ZomeApiResult<Address> {
  let commit = Commit::try_from(crate::utils::get_entry_content(commit_address)?)?;
  Ok(commit.context_address)
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
  let to_commit: Commit = Commit::try_from(crate::utils::get_entry_content(to_commit_address)?)?;

  create_commit(
    to_commit.context_address,
    merge_commit_message,
    merge_object_address,
    &vec![from_commit_address.to_owned(), to_commit_address.to_owned()],
  )
}
