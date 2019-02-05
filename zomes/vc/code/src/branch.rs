use hdk::{
  entry_definition::ValidatingEntryType,
  error::{ZomeApiError, ZomeApiResult},
  holochain_core_types::{
    cas::content::Address, dna::entry_types::Sharing, entry::Entry, error::HolochainError,
    json::JsonString,
  },
};
use crate::object::Object;
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
 * Retrieves the information about the branch
 */
pub fn handle_get_branch_info(branch_address: Address) -> ZomeApiResult<Option<Entry>> {
  hdk::get_entry(&branch_address)
}

/**
 * Handles the creation of a commit: store all the contents of the commit, and commits them in the branch
 */
pub fn handle_create_commit(
  branch_address: Address,
  message: String,
  content: Object,
) -> ZomeApiResult<Address> {
  let object_address = crate::object::store_object(content)?;
  create_commit_in_branch(branch_address, message, object_address)
}

/**
 * Returns the address of the head commit for the given branch
 */
pub fn handle_get_branch_head(branch_address: Address) -> ZomeApiResult<Address> {
  let links_result = hdk::get_links(&branch_address, "branch_head")?;

  if links_result.addresses().len() == 0 {
    return Err(ZomeApiError::from(String::from(
      "given branch has not commits",
    )));
  }
  Ok(links_result.addresses().last().unwrap().to_owned())
}

/**
 * Merges the head commits of the two given branches and returns the resulting commit
 */
pub fn handle_merge_branches(
  from_branch_address: Address,
  to_branch_address: Address,
) -> ZomeApiResult<Address> {
  let from_branch: Branch =
    Branch::try_from(crate::utils::get_entry_content(&from_branch_address)?)?;
  let to_branch: Branch = Branch::try_from(crate::utils::get_entry_content(&to_branch_address)?)?;

  if from_branch.context_address != to_branch.context_address {
    return Err(ZomeApiError::from(String::from(
      "given branches do not belong to the same context",
    )));
  }

  let from_commit_address = handle_get_branch_head(from_branch_address)?;
  let to_commit_address = handle_get_branch_head(to_branch_address.clone())?;

  let merged_commit_address = crate::commit::merge_commits(
    &from_commit_address,
    &to_commit_address,
    format!("merge {} into {}", from_branch.name, to_branch.name),
  )?;

  set_branch_head(&to_branch_address, &merged_commit_address)?;

  Ok(merged_commit_address)
}

/** Helper functions */

/**
 * Sets the given branch head pointing to the given commit head
 */
pub fn set_branch_head(branch_address: &Address, commit_address: &Address) -> ZomeApiResult<()> {
  // TODO: delete the previous link to the branch head commit
  hdk::link_entries(branch_address, commit_address, "branch_head")
}

/**
 * Create a new commit in the given branch, pointing to the given tree address
 */
pub fn create_commit_in_branch(
  branch_address: Address,
  message: String,
  content_address: Address,
) -> ZomeApiResult<Address> {
  let branch = Branch::try_from(crate::utils::get_entry_content(&branch_address)?)?;
  let parent_commit_address = hdk::get_links(&branch_address, "branch_head")?;

  let commit_address = crate::commit::create_commit(
    branch.context_address,
    message,
    content_address,
    parent_commit_address.addresses(),
  )?;

  set_branch_head(&branch_address, &commit_address)?;

  Ok(commit_address)
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
  commit_address: &Address,
  name: String,
) -> ZomeApiResult<Address> {
  let branch_address = create_new_empty_branch(context_address, name)?;

  hdk::link_entries(&branch_address, commit_address, "branch_head")?;

  Ok(branch_address)
}
