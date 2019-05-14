use crate::perspective;
use hdk::{
  entry_definition::ValidatingEntryType,
  error::ZomeApiResult,
  holochain_core_types::{
    cas::content::Address, dna::entry_types::Sharing, entry::Entry, error::HolochainError,
    json::JsonString,
  },
  AGENT_ADDRESS, PUBLIC_TOKEN,
};
use holochain_wasm_utils::api_serialization::{
  get_entry::{GetEntryOptions, GetEntryResult},
  get_links::{GetLinksOptions, GetLinksResult},
};
use std::convert::TryFrom;

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Context {
  creator: Address,
  timestamp: u64,
  nonce: u128,
}

impl Context {
  fn new(timestamp: u64, nonce: u128) -> Context {
    Context {
      creator: AGENT_ADDRESS.to_owned(),
      timestamp: timestamp.to_owned(),
      nonce: nonce.to_owned(),
    }
  }
}

pub fn definition() -> ValidatingEntryType {
  entry!(
    name: "context",
    description: "a context containing different perspectives",
    sharing: Sharing::Public,

    validation_package: || {
      hdk::ValidationPackageDefinition::ChainFull
    },

    validation: |_ctx: hdk::EntryValidationData<Context>| {
      Ok(())
    },

    links: [
      from!(
        "%agent_id",
        tag: "root",
        validation_package: || {
          hdk::ValidationPackageDefinition::ChainFull
        },
        validation: |_validation_data: hdk::LinkValidationData | {
          Ok(())
        }
      ),
      from!(
        "%agent_id",
        tag: "created_contexts",
        validation_package: || {
          hdk::ValidationPackageDefinition::ChainFull
        },
        validation: |_validation_data: hdk::LinkValidationData | {
          Ok(())
        }
      ),
      from!(
        "%agent_id",
        tag: "all_contexts",
        validation_package: || {
          hdk::ValidationPackageDefinition::ChainFull
        },
        validation: | _validation_data: hdk::LinkValidationData | {
          Ok(())
        }
      ),
      to!(
        "perspective",
        tag: "perspectives",
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
 * Create a new context with the given name, passing the author and the current time
 */
pub fn handle_create_context(context: Context) -> ZomeApiResult<Address> {
  let context_entry = context_entry(context);
  let context_address = hdk::commit_entry(&context_entry)?;

  hdk::link_entries(&AGENT_ADDRESS, &context_address, "created_contexts")?;
  hdk::link_entries(
    &AGENT_ADDRESS, // TODO: change for DNA address
    &context_address,
    "all_contexts",
  )?;

  Ok(context_address)
}

/**
 * Returns the root context of the agent, created at genesis time
 */
pub fn handle_get_root_context() -> ZomeApiResult<GetEntryResult> {
  let links = hdk::get_links_result(
    &AGENT_ADDRESS,
    "root",
    GetLinksOptions::default(),
    GetEntryOptions::default(),
  )?;

  // TODO: Comment when genesis block is executed
  match links.len() {
    1 => links[0].clone(),
    _ => {
      create_root_context()?;
      handle_get_root_context()
    }
  }
  /*
    TODO: Uncomment when genesis block is executed
  match links.len() {
      1 => links[0].clone(),
      _ => Err(ZomeApiError::from(format!(
        "agent has {} root contexts",
        links.len()
      ))),
    }
   */
}

/**
 * Returns a list with all the contexts created by the agent
 */
pub fn handle_get_created_contexts() -> ZomeApiResult<Vec<ZomeApiResult<GetEntryResult>>> {
  hdk::get_links_result(
    &AGENT_ADDRESS,
    "created_contexts",
    GetLinksOptions::default(),
    GetEntryOptions::default(),
  )
}

/**
 * Returns a list with all the contexts created in the app
 */
pub fn handle_get_all_contexts() -> ZomeApiResult<Vec<ZomeApiResult<GetEntryResult>>> {
  hdk::get_links_result(
    &AGENT_ADDRESS, // TODO: change for DNA address
    "all_contexts",
    GetLinksOptions::default(),
    GetEntryOptions::default(),
  )
}

/**
 * Retrieves the information about the context
 */
pub fn handle_get_context_info(context_address: Address) -> ZomeApiResult<GetEntryResult> {
  hdk::get_entry_result(&context_address, GetEntryOptions::default())
}

/**
 * Returns the perspectives of the context
 */
pub fn handle_get_context_perspectives(context_address: Address) -> ZomeApiResult<GetLinksResult> {
  hdk::get_links(&context_address, "perspectives")
}

/**
 * Returns the commit history from all the perspectives from the given context
 */
pub fn handle_get_context_history(context_address: Address) -> ZomeApiResult<Vec<GetEntryResult>> {
  let context_perspectives = handle_get_context_perspectives(context_address)?;
  Ok(
    context_perspectives
      .addresses()
      .into_iter()
      .flat_map(|perspective_address| {
        let perspective_history =
          crate::perspective::get_perspective_history(perspective_address.to_owned()).unwrap();
        perspective_history.into_iter()
      })
      .collect(),
  )
}

/**
 * Returns the address of the context with the given properties
 */
pub fn handle_get_context_address(context: Context) -> ZomeApiResult<Address> {
  hdk::entry_address(&context_entry(context))
}

/** Helper functions */

fn context_entry(context: Context) -> Entry {
  Entry::App("context".into(), context.into())
}

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct AddressResponse {
  Ok: Address,
}

/**
 * Creates the root context for the agent
 * Only to be called at genesis time
 */
pub fn create_root_context() -> ZomeApiResult<Address> {
  let json_response = hdk::call(
    hdk::THIS_INSTANCE,
    "documents",
    Address::from(PUBLIC_TOKEN.to_string()),
    "create_text_node",
    json!({
      "node": {
        "text": "Hi",
        "links": {}
      }
    })
    .into(),
  )?;
  let response = AddressResponse::try_from(json_response)?;

  let commit = crate::commit::create_initial_commit(&response.Ok);

  let result = crate::perspective::handle_create_perspective_and_content(Context::new(0, 0), String::from("root"), commit)?;

  hdk::link_entries(&AGENT_ADDRESS, &result.context_address, "root")?;

  Ok(result.context_address)
}
