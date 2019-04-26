use crate::content::Content;
use hdk::{
  entry_definition::ValidatingEntryType,
  error::{ZomeApiError, ZomeApiResult},
  holochain_core_types::{
    cas::content::Address, dna::entry_types::Sharing, entry::Entry, error::HolochainError,
    json::JsonString,
  },
};
use holochain_wasm_utils::api_serialization::get_entry::{GetEntryOptions, GetEntryResult};
use std::convert::TryFrom;

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Perspective {
  context_address: Address,
  name: String,
}

impl Perspective {
  fn new(context_address: &Address, name: &str) -> Perspective {
    Perspective {
      context_address: context_address.to_owned(),
      name: name.to_owned(),
    }
  }
}

pub fn definition() -> ValidatingEntryType {
  entry!(
    name: "perspective",
    description: "perspective pointing to a commit",
    sharing: Sharing::Public,

    validation_package: || {
      hdk::ValidationPackageDefinition::ChainFull
    },

    validation: |_ctx: hdk::EntryValidationData<Perspective>| {
      Ok(())
    },

    links: [
      to!(
        "commit",
        tag: "head",
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

/** Zome exposed functions */

/**
 * Retrieves the information about the perspective
 */
pub fn handle_get_perspective_info(perspective_address: Address) -> ZomeApiResult<GetEntryResult> {
  hdk::get_entry_result(&perspective_address, GetEntryOptions::default())
}

/**
 * Handles the creation of a commit: store all the contents of the commit, and commits them in the perspective
 */
pub fn handle_create_commit(
  perspective_address: Address,
  message: String,
  content: Content,
) -> ZomeApiResult<Address> {
  let content_address = crate::content::store_content(content)?;
  create_commit_in_perspective(perspective_address, message, content_address)
}

/**
 * Returns the address of the head commit for the given perspective
 */
pub fn handle_get_perspective_head(perspective_address: Address) -> ZomeApiResult<Address> {
  let links_result = hdk::get_links(&perspective_address, "head")?;

  if links_result.addresses().len() == 0 {
    return Err(ZomeApiError::from(String::from(
      "given perspective has not commits",
    )));
  }
  Ok(links_result.addresses().last().unwrap().to_owned())
}

/**
 * Merges the head commits of the two given perspectives and returns the resulting commit
 */
pub fn handle_merge_perspectives(
  from_perspective_address: Address,
  to_perspective_address: Address,
) -> ZomeApiResult<Address> {
  let from_perspective: Perspective =
    Perspective::try_from(crate::utils::get_entry_content(&from_perspective_address)?)?;
  let to_perspective: Perspective = Perspective::try_from(crate::utils::get_entry_content(&to_perspective_address)?)?;

  if from_perspective.context_address != to_perspective.context_address {
    return Err(ZomeApiError::from(String::from(
      "given perspectives do not belong to the same context",
    )));
  }

  let from_commit_address = handle_get_perspective_head(from_perspective_address)?;
  let to_commit_address = handle_get_perspective_head(to_perspective_address.clone())?;

  let merged_commit_address = crate::commit::merge_commits(
    &from_commit_address,
    &to_commit_address,
    format!("merge {} into {}", from_perspective.name, to_perspective.name),
  )?;

  set_perspective_head(&to_perspective_address, &merged_commit_address)?;

  Ok(merged_commit_address)
}

/** Helper functions */

/**
 * Sets the given perspective head pointing to the given commit head
 */
pub fn set_perspective_head(perspective_address: &Address, commit_address: &Address) -> ZomeApiResult<()> {
  let previous_head = hdk::get_links(&perspective_address, "head")?;
  if previous_head.addresses().len() != 0 {
    hdk::remove_link(
      perspective_address,
      &previous_head.addresses().first().unwrap(),
      "head",
    )?;
  }

  hdk::link_entries(perspective_address, commit_address, "head")
}

/**
 * Create a new commit in the given perspective, pointing to the given tree address
 */
pub fn create_commit_in_perspective(
  perspective_address: Address,
  message: String,
  content_address: Address,
) -> ZomeApiResult<Address> {
  let perspective = Perspective::try_from(crate::utils::get_entry_content(&perspective_address)?)?;
  let parent_commit_address = hdk::get_links(&perspective_address, "head")?;

  let commit_address = crate::commit::create_commit(
    perspective.context_address,
    message,
    content_address,
    &parent_commit_address.addresses(),
  )?;

  set_perspective_head(&perspective_address, &commit_address)?;

  Ok(commit_address)
}

/**
 * Create new perspective with the given name
 */
pub fn create_new_empty_perspective(context_address: &Address, name: String) -> ZomeApiResult<Address> {
  let perspective_entry = Entry::App("perspective".into(), Perspective::new(context_address, &name).into());
  hdk::commit_entry(&perspective_entry)
}

/**
 * Create new perspective with the given name with the head pointing the given commit
 */
pub fn create_new_perspective(
  context_address: &Address,
  commit_address: &Address,
  name: String,
) -> ZomeApiResult<Address> {
  let perspective_address = create_new_empty_perspective(context_address, name)?;

  hdk::link_entries(&perspective_address, commit_address, "head")?;

  Ok(perspective_address)
}

pub fn get_perspective_history(perspective_address: Address) -> ZomeApiResult<Vec<GetEntryResult>> {
  let perspective_head = handle_get_perspective_head(perspective_address)?;
  crate::commit::get_commit_history(perspective_head)
}
