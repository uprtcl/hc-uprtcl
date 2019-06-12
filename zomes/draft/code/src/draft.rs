use hdk::PUBLIC_TOKEN;
use hdk::{
  entry_definition::ValidatingEntryType,
  error::ZomeApiResult,
  holochain_core_types::{
    cas::content::{Address, AddressableContent, Content},
    dna::entry_types::Sharing,
    entry::Entry,
    error::HolochainError,
    json::JsonString,
    link::LinkMatch,
  },
};
use std::convert::{TryFrom, TryInto};
use crate::utils;

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Draft {
  pub draft: Content,
}

impl Draft {
  fn new(draft: Content) -> Draft {
    Draft {
      draft: draft.to_owned(),
    }
  }
}

pub fn definition() -> ValidatingEntryType {
  entry!(
    name: "draft",
    description: "generic draft",
    sharing: Sharing::Public,
    validation_package: || {
      hdk::ValidationPackageDefinition::Entry
    },

    validation: | _validation_data: hdk::EntryValidationData<Draft>| {
      Ok(())
    },

    links: [
      from!(
        "workspace",
        link_type: "draft",
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

/**
 * Removes the previous draft if existed,
 * creates or uses the user's workspace for given entry address and
 * stores the given draft in the workspace
 */
pub fn handle_set_draft(entry_address: Address, draft: Option<Content>) -> ZomeApiResult<()> {
  let workspace_address = get_or_create_workspace(entry_address)?;
  utils::remove_previous_links(&workspace_address, Some(String::from("draft")), None)?;

  if let Some(draft_content) = draft {
    let draft_entry = Entry::App("draft".into(), Draft::new(draft_content).into());
    let draft_address = utils::store_entry_if_new(&draft_entry)?;

    hdk::link_entries(&workspace_address, &draft_address, "draft", "")?;
  }

  Ok(())
}

/**
 * Returns the draft for the given entry_address, returning not found result if it didn't exist
 */
pub fn handle_get_draft(entry_address: Address) -> ZomeApiResult<Content> {
  // Get personal workspace for the given entry
  let response = hdk::call(
    hdk::THIS_INSTANCE,
    "workspace",
    Address::from(PUBLIC_TOKEN.to_string()),
    "get_my_workspace",
    json!({ "entry_address": entry_address }).into(),
  )?;
  let maybe_workspace_address: ZomeApiResult<Option<Address>> = response.try_into()?;

  match maybe_workspace_address? {
    // If workspace does not exist, return not found
    None => Ok(not_found_result()),
    Some(workspace_address) => {
      // Workspace does exist, look for its current draft
      let links = hdk::get_links_and_load(
        &workspace_address,
        LinkMatch::Exactly("draft"),
        LinkMatch::Any,
      )?;

      // No drafts, return not found
      if links.len() == 0 {
        return Ok(not_found_result());
      }

      // Convert first link to draft and return its content
      match Entry::try_from_content(&links[0].to_owned().unwrap().content())? {
        Entry::App(_, entry) => {
          let draft: Draft = Draft::try_from(entry)?;
          Ok(draft.draft)
        }
        _ => Ok(not_found_result()),
      }
    }
  }
}

/** Helpers */

/**
 * Calls the workspace zome to get or create a personal workspace with the given entry
 */
fn get_or_create_workspace(entry_address: Address) -> ZomeApiResult<Address> {
  let response = hdk::call(
    hdk::THIS_INSTANCE,
    "workspace",
    Address::from(PUBLIC_TOKEN.to_string()),
    "get_or_create_workspace",
    json!({ "entry_address": entry_address }).into(),
  )?;
  response.try_into()?
}

/**
 * Common not found message result
 */
fn not_found_result() -> Content {
  json!({
    "message": "entry has no drafts"
  })
  .into()
}
