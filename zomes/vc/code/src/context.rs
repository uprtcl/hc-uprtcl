use crate::commit::Commit;
use hdk::{
  entry_definition::ValidatingEntryType,
  error::ZomeApiResult,
  holochain_core_types::{
    cas::content::Address, dna::entry_types::Sharing, entry::Entry, error::HolochainError,
    json::JsonString,
  },
  AGENT_ADDRESS,
};
use holochain_wasm_utils::api_serialization::{get_entry::{GetEntryOptions,GetEntryResult},get_links::GetLinksResult};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Debug, DefaultJson)]
pub struct Context {
  name: String,
  date_created: String,
  created_by: Address,
}

impl Context {
  fn new(name: &str, date_created: &str, created_by: &Address) -> Context {
    Context {
      name: name.to_owned(),
      date_created: date_created.to_owned(),
      created_by: created_by.to_owned(),
    }
  }
}

pub fn definition() -> ValidatingEntryType {
  entry!(
    name: "context",
    description: "a context containing branches",
    sharing: Sharing::Public,
    native_type: Context,

    validation_package: || {
      hdk::ValidationPackageDefinition::ChainFull
    },

    validation: |context: Context, _ctx: hdk::ValidationData| {
      Ok(())
    },

    links: [
      to!(
        "branch",
        tag: "active_branches",
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
 * Create a new context with the given name, passing the author and the current time
 */
pub fn handle_create_context(name: String) -> ZomeApiResult<Address> {
  // Create context
  let context_entry = Entry::App(
    "context".into(),
    Context::new(&name, "now", &AGENT_ADDRESS).into(),
  );
  let context_address = hdk::commit_entry(&context_entry)?;

  // Create main starting branch and link it to the newly created context
  let branch_address =
    crate::branch::create_new_empty_branch(&context_address, String::from("master"))?;
  link_branch_to_context(&context_address, &branch_address)?;

  Ok(context_address)
}

/**
 * Retrieves the information about the context
 */
pub fn handle_get_context_info(context_address: Address) -> ZomeApiResult<GetEntryResult> {
  hdk::get_entry_result(&context_address, GetEntryOptions::default())
}

/**
 * Creates a new branch in the given context with the head pointing to the given commit
 */
pub fn handle_create_branch_in_context(
  commit_address: Address,
  name: String,
) -> ZomeApiResult<Address> {
  let context_address = crate::commit::get_context_address(&commit_address)?;

  let branch_address = crate::branch::create_new_branch(&context_address, &commit_address, name)?;

  link_branch_to_context(&context_address, &branch_address)?;

  Ok(branch_address)
}

/**
 * Returns the branches of the context
 */
pub fn handle_get_context_branches(context_address: Address) -> ZomeApiResult<GetLinksResult> {
  hdk::get_links(&context_address, "active_branches")
}

pub fn handle_create_context_and_commit(context_name: String, commit_message: String, content_address: Address) -> ZomeApiResult<Address> {
  let context_address = handle_create_context(context_name)?;

  let branch_addresses = handle_get_context_branches(context_address.clone())?;
  let master_address = branch_addresses.addresses().first().unwrap().to_owned();

  crate::branch::handle_create_commit(master_address, commit_message, crate::object::Object::new(Some(content_address), HashMap::new()))?;

  Ok(context_address)
}

/** Helper functions */

/**
 * Links the given branch to the given repository as an active branch
 */
pub fn link_branch_to_context(
  context_address: &Address,
  branch_address: &Address,
) -> ZomeApiResult<()> {
  hdk::link_entries(context_address, branch_address, "active_branches")
}
