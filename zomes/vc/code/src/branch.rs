use crate::commit::{
  CommitContent,
  CommitContent::{ContentBlob, ContentTree},
};
use boolinator::Boolinator;
use hdk::{
  entry_definition::ValidatingEntryType,
  error::{ZomeApiError, ZomeApiResult},
  holochain_core_types::{
    cas::content::Address, dna::entry_types::Sharing, entry::Entry, error::HolochainError,
    json::JsonString,
  },
};
use std::convert::TryFrom;

#[derive(Serialize, Deserialize, Debug, DefaultJson)]
pub struct Branch {
  context_address: Address,
  name: String,
}

impl Branch {
  fn new(context_address: &Address, name: &str) -> Branch {
    Branch {
      context_address: context_address.to_owned(),
      name: name.to_owned(),
    }
  }
}

pub fn definition() -> ValidatingEntryType {
  entry!(
    name: "branch",
    description: "branch pointing to a commit object",
    sharing: Sharing::Public,
    native_type: Branch,

    validation_package: || {
      hdk::ValidationPackageDefinition::ChainFull
    },

    validation: |branch: Branch, _ctx: hdk::ValidationData| {
      Ok(())
    },

    links: [
      to!(
        "commit",
        tag: "branch_head",
        validation_package: || {
          hdk::ValidationPackageDefinition::ChainFull
        },
        validation: |_source: Address, _target: Address, _ctx: hdk::ValidationData | {
          Ok(())
        }
      )
    ]
  )
}

/** Zome exposed functions */

/**
 * Handles the creation of a commit: store all the contents of the commit, and commits them in the branch
 */
pub fn handle_create_commit(
  branch_address: Address,
  message: String,
  content: CommitContent,
) -> ZomeApiResult<Address> {
  let content_address = store_commit_content(content)?;

  create_commit_in_branch(branch_address, message, content_address)
}

/** Helper functions */

/**
 * Stores the contents of the commit in the DHT
 */
fn store_commit_content(content: CommitContent) -> ZomeApiResult<Address> {
  match content {
    ContentBlob(blob) => crate::blob::store_blob(blob),
    ContentTree(tree) => crate::tree::store_tree(tree),
  }
}

/**
 * Create a new commit in the given branch, pointing to the given tree address
 */
pub fn create_commit_in_branch(
  branch_address: Address,
  message: String,
  content_address: Address,
) -> ZomeApiResult<Address> {
  let maybe_branch_entry = hdk::get_entry(&branch_address)?;

  match hdk::get_entry(&branch_address)? {
    Some(Entry::App(_, branch_entry)) => {
      let branch = Branch::try_from(branch_entry)?;
      let parent_commit_address = hdk::get_links(&branch_address, "branch_head")?;

      let commit_address = crate::commit::create_commit(
        branch.context_address,
        message,
        content_address,
        parent_commit_address.addresses().to_owned(),
      )?;

      // TODO: delete the previous link to the branch head commit
      hdk::link_entries(&branch_address, &commit_address, "branch_head")?;

      Ok(commit_address)
    }
    _ => Err(ZomeApiError::from(String::from("branch does not exist"))),
  }
}

/**
 * Create new branch with the given name
 */
pub fn create_new_empty_branch(context_address: &Address, name: String) -> ZomeApiResult<Address> {
  let branch_entry = Entry::App("branch".into(), Branch::new(context_address, &name).into());
  hdk::commit_entry(&branch_entry)
}

/**
 * Create new branch with the given name with the head pointing the given commit
 */
pub fn create_new_branch(
  context_address: &Address,
  commit_address: Address,
  name: String,
) -> ZomeApiResult<Address> {
  let branch_address = create_new_empty_branch(context_address, name)?;

  hdk::link_entries(&branch_address, &commit_address, "branch_head")?;

  Ok(branch_address)
}
