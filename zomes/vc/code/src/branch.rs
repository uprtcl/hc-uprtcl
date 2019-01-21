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
};

use crate::tree::CommitTree;

#[derive(Serialize, Deserialize, Debug, DefaultJson)]
pub struct Branch {
  name: String,
}

impl Branch {
  fn new(name: &str) -> Branch {
    Branch {
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

/**
 * Handles the creation of a commit: store all the contents of the commit, and commits them in the branch
 */
pub fn handle_create_commit(
  branch_address: Address,
  message: String,
  content: CommitTree,
) -> ZomeApiResult<Address> {
  let tree_address = crate::tree::store_tree_content(content)?;

  create_commit_in_branch(branch_address, message, tree_address)
}

/**
 * Create a new commit in the given branch, pointing to the given tree address
 */
pub fn create_commit_in_branch(
  branch_address: Address,
  message: String,
  tree_address: Address,
) -> ZomeApiResult<Address> {
  let parent_commit_address = hdk::get_links(&branch_address, "branch_head")?;

  let commit_address =
    crate::commit::create_commit(message, tree_address, parent_commit_address.addresses().to_owned())?;

  // TODO: delete the previous link to the branch head commit
  hdk::link_entries(&branch_address, &commit_address, "branch_head")?;

  Ok(commit_address)
}

/** 
 * Create new branch with the given name
 */
pub fn create_new_empty_branch(name: String) -> ZomeApiResult<Address> {
  let branch_entry = Entry::App("branch".into(), Branch::new(&name).into());
  hdk::commit_entry(&branch_entry)
}

/**
 * Create new branch with the given name with the head pointing the given commit 
 */
pub fn create_new_branch(commit_address: Address, name: String) -> ZomeApiResult<Address> {
  let branch_address = create_new_empty_branch(name)?;

  hdk::link_entries(&branch_address, &commit_address, "branch_head")?;

  Ok(branch_address)
}
