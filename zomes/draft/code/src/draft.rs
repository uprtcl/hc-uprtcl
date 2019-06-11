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
  },
};
use std::convert::{TryFrom, TryInto};

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

fn get_or_create_workspace(entry_address: Address) -> ZomeApiResult<Address> {
  let response = hdk::call(
    hdk::THIS_INSTANCE,
    "workspace",
    Address::from(PUBLIC_TOKEN.to_string()),
    "get_or_create_workspace",
    json!({ "entry_address": entry_address }).into(),
  )?;
  crate::utils::response_to_address(response)
}

/**
 * Removes the previous draft from the workspace
 */
fn remove_link_to_draft(workspace_address: &Address) -> ZomeApiResult<()> {
  let links = hdk::get_links(workspace_address, Some(String::from("draft")), None)?;

  if links.addresses().len() > 0 {
    hdk::remove_link(&workspace_address, &links.addresses()[0], "draft", "")?;
  }

  Ok(())
}

/**
 * Removes the previous draft if existed,
 * creates or uses the user's workspace for given entry address and
 * stores the given draft in the workspace
 */
pub fn handle_set_draft(entry_address: Address, draft: Option<Content>) -> ZomeApiResult<()> {
  let workspace_address = get_or_create_workspace(entry_address)?;
  remove_link_to_draft(&workspace_address)?;

  if let Some(draft_content) = draft {
    let draft_entry = Entry::App("draft".into(), Draft::new(draft_content).into());
    let draft_address = crate::utils::commit_entry_if_missing(draft_entry)?;

    hdk::link_entries(&workspace_address, &draft_address, "draft", "")?;
  }

  Ok(())
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

/**
 * Returns the draft for the given entry_address, returning not found result if it didn't exist
 */
pub fn handle_get_draft(entry_address: Address) -> ZomeApiResult<Content> {
  let response = hdk::call(
    hdk::THIS_INSTANCE,
    "workspace",
    Address::from(PUBLIC_TOKEN.to_string()),
    "get_workspace",
    json!({ "entry_address": entry_address }).into(),
  )?;
  let maybe_workspace_address: ZomeApiResult<Option<Address>> = response.try_into()?;

  match maybe_workspace_address? {
    None => Ok(not_found_result()),
    Some(workspace_address) => {
      let links = hdk::get_links_and_load(
        &workspace_address,
        LinkMatch::Exactly("draft"),
        LinkMatch::Any,
      )?;

      if links.len() == 0 {
        return Ok(not_found_result());
      }

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
