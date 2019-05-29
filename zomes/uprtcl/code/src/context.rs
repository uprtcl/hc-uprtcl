use hdk::{
  entry_definition::ValidatingEntryType,
  error::ZomeApiResult,
  holochain_core_types::{
    cas::content::Address, dna::entry_types::Sharing, entry::Entry, error::HolochainError,
    json::JsonString,
  },
  AGENT_ADDRESS, DNA_ADDRESS,
};
use holochain_wasm_utils::api_serialization::{
  get_entry::{GetEntryOptions, GetEntryResult},
  get_links::GetLinksOptions,
};

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Context {
  creator: Address,
  timestamp: u128,
  nonce: u128,
}

impl Context {
  fn new(timestamp: u128, nonce: u128) -> Context {
    Context {
      creator: AGENT_ADDRESS.to_owned(),
      timestamp: timestamp.to_owned(),
      nonce: nonce.to_owned(),
    }
  }

  pub fn root_context() -> Context {
    Context {
      creator: AGENT_ADDRESS.to_owned(),
      timestamp: 0,
      nonce: 0,
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
        link_type: "created_contexts",
        validation_package: || {
          hdk::ValidationPackageDefinition::ChainFull
        },
        validation: |_validation_data: hdk::LinkValidationData | {
          Ok(())
        }
      ),
      from!(
        "%agent_id",
        link_type: "all_contexts",
        validation_package: || {
          hdk::ValidationPackageDefinition::ChainFull
        },
        validation: | _validation_data: hdk::LinkValidationData | {
          Ok(())
        }
      ),
      to!(
        "perspective",
        link_type: "perspectives",
        validation_package: || {
          hdk::ValidationPackageDefinition::ChainFull
        },
        validation: |_validation_data: hdk::LinkValidationData | {
          Ok(())
        }
      ),
      from!(
        "%agent_id",
        link_type: "root",
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
pub fn handle_create_context(timestamp: u128, nonce: u128) -> ZomeApiResult<Address> {
  create_context(Context::new(timestamp, nonce))
}

/**
 * Clones the given context and returns the new address
 */
pub fn handle_clone_context(context: Context) -> ZomeApiResult<Address> {
  create_context(context)
}

/**
 * Returns a list with all the contexts created by the agent
 */
pub fn handle_get_created_contexts() -> ZomeApiResult<Vec<ZomeApiResult<GetEntryResult>>> {
  hdk::get_links_result(
    &AGENT_ADDRESS,
    Some(String::from("created_contexts")),
    None,
    GetLinksOptions::default(),
    GetEntryOptions::default(),
  )
}

/**
 * Returns a list with all the contexts created in the app
 */
pub fn handle_get_all_contexts() -> ZomeApiResult<Vec<ZomeApiResult<GetEntryResult>>> {
  hdk::get_links_result(
    &DNA_ADDRESS,
    Some(String::from("all_contexts")),
    None,
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
pub fn handle_get_context_perspectives(
  context_address: Address,
) -> ZomeApiResult<Vec<ZomeApiResult<GetEntryResult>>> {
  hdk::get_links_result(
    &context_address,
    Some(String::from("perspectives")),
    None,
    GetLinksOptions::default(),
    GetEntryOptions::default(),
  )
}

/**
 * Returns the address of the context with the given properties
 */
pub fn handle_get_context_address(context: Context) -> ZomeApiResult<Address> {
  hdk::entry_address(&context_entry(context))
}

/**
 * Returns the root perspective of the agent, created at genesis time
 */
pub fn handle_get_root_context_id() -> ZomeApiResult<Address> {
  let links = hdk::get_links(&AGENT_ADDRESS, Some(String::from("root")), None)?;

  // TODO: Comment when genesis block is executed
  match links.addresses().len() {
    1 => Ok(links.addresses()[0].clone()),
    _ => {
      create_root_context_and_perspective()?;
      handle_get_root_context_id()
    }
  }
  /*
    TODO: Uncomment when genesis block is executed
  match links.addresses().len() {
    1 => Ok(links.addresses()[0].clone()),
    _ => Err(ZomeApiError::from(format!(
      "agent has {} root contexts",
      links.addresses().len()
    ))),
  }
   */
}

/** Helper functions */

/**
 * Formats the given context as an entry
 */
fn context_entry(context: Context) -> Entry {
  Entry::App("context".into(), context.into())
}

/**
 * Creates a context and returns its address
 */
pub fn create_context(context: Context) -> ZomeApiResult<Address> {
  let context_entry = context_entry(context);
  let context_address = hdk::commit_entry(&context_entry)?;

  hdk::link_entries(&AGENT_ADDRESS, &context_address, "created_contexts", "")?;
  hdk::link_entries(&AGENT_ADDRESS, &context_address, "all_contexts", "")?;

  Ok(context_address)
}

/**
 * Creates the root perspective for the agent
 * Only to be called at genesis time
 */
pub fn create_root_context_and_perspective() -> ZomeApiResult<()> {
  let context_address = create_context(crate::context::Context::root_context())?;

  crate::perspective::handle_create_perspective(
    context_address.clone(),
    String::from("root"),
    0,
    None,
  )?;

  hdk::link_entries(&AGENT_ADDRESS, &context_address, "root", "")?;

  Ok(())
}
