use hdk::{
  entry_definition::ValidatingEntryType,
  error::{ZomeApiError, ZomeApiResult},
  holochain_core_types::{
    cas::content::Address, dna::entry_types::Sharing, entry::Entry, error::HolochainError,
    json::JsonString,
  },
  AGENT_ADDRESS,
};
use holochain_wasm_utils::api_serialization::{
  get_entry::{GetEntryOptions, GetEntryResult},
  get_links::{GetLinksOptions, GetLinksResult},
};

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Context {
  creator: Address,
  timestamp: String,
}

impl Context {
  fn new() -> Context {
    Context {
      creator: AGENT_ADDRESS.to_owned(),
      timestamp: String::from("now"),
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
pub fn handle_create_context(name: String) -> ZomeApiResult<Address> {
  let context_address = create_context_entry()?;

  // Create main starting perspective and link it to the newly created context
  let perspective_address =
    crate::perspective::create_new_empty_perspective(name, &context_address)?;
  link_perspective_to_context(&context_address, &perspective_address)?;

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

  match links.len() {
    1 => links[0].clone(),
    _ => Err(ZomeApiError::from(format!(
      "agent has {} root contexts",
      links.len()
    ))),
  }
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
 * Creates a new perspective in the given context with the head pointing to the given commit
 */
pub fn handle_create_perspective_in_context(
  context_address: Address,
  commit_address: Address,
  name: String,
) -> ZomeApiResult<Address> {
  let perspective_address =
    crate::perspective::create_new_perspective(&context_address, &commit_address, name)?;

  link_perspective_to_context(&context_address, &perspective_address)?;

  Ok(perspective_address)
}

/**
 * Returns the perspectives of the context
 */
pub fn handle_get_context_perspectives(context_address: Address) -> ZomeApiResult<GetLinksResult> {
  hdk::get_links(&context_address, "perspectives")
}

#[derive(Serialize, Deserialize, Debug, DefaultJson)]
pub struct CreatedCommitResponse {
  context_address: Address,
  perspective_address: Address,
  commit_address: Address,
}

/**
 * Creates a context, a perspective and a commit and return the addresses
 */
pub fn handle_create_context_and_commit(
  name: String,
  message: String,
  content: crate::content::Content,
) -> ZomeApiResult<CreatedCommitResponse> {
  let context_address = create_context_entry()?;

  // Create main starting perspective and link it to the newly created context
  let perspective_address =
    crate::perspective::create_new_empty_perspective(name, &context_address)?;
  link_perspective_to_context(&context_address, &perspective_address)?;

  let commit_address =
    crate::perspective::handle_create_commit(perspective_address.clone(), message, content)?;

  Ok(CreatedCommitResponse {
    context_address: context_address,
    perspective_address: perspective_address,
    commit_address: commit_address,
  })
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

/** Helper functions */

/**
 * Creates the root context for the agent
 * Only to be called at genesis time
 */
pub fn create_root_context() -> ZomeApiResult<Address> {
  let context_address = handle_create_context(String::from("root"))?;
  hdk::link_entries(&AGENT_ADDRESS, &context_address, "root")?;

  Ok(context_address)
}

/**
 * Helper to create and commit an empty context empty, with the appropiate links
 */
pub fn create_context_entry() -> ZomeApiResult<Address> {
  // Create context
  let context_entry = Entry::App("context".into(), Context::new().into());
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
 * Links the given perspective to the given context
 */
pub fn link_perspective_to_context(
  context_address: &Address,
  perspective_address: &Address,
) -> ZomeApiResult<Address> {
  hdk::link_entries(context_address, perspective_address, "perspectives")
}
