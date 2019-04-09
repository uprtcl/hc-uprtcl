use hdk::{
  entry_definition::ValidatingEntryType,
  error::ZomeApiResult,
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

    validation_package: || {
      hdk::ValidationPackageDefinition::ChainFull
    },

    validation: |_ctx: hdk::EntryValidationData<Context>| {
      Ok(())
    },

    links: [
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
        "branch",
        tag: "active_branches",
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
  let context_address = create_context_entry(name)?;

  // Create main starting branch and link it to the newly created context
  let branch_address =
    crate::branch::create_new_empty_branch(&context_address, String::from("master"))?;
  link_branch_to_context(&context_address, &branch_address)?;

  Ok(context_address)
}

pub fn handle_get_created_contexts() -> ZomeApiResult<Vec<ZomeApiResult<GetEntryResult>>> {
  hdk::get_links_result(
    &AGENT_ADDRESS,
    "created_contexts",
    GetLinksOptions::default(),
    GetEntryOptions::default(),
  )
}

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

#[derive(Serialize, Deserialize, Debug, DefaultJson)]
pub struct CreatedCommitResponse {
  context_address: Address,
  branch_address: Address,
  commit_address: Address,
}

/**
 * Creates a context, a branch and a commit and return the addresses
 */
pub fn handle_create_context_and_commit(
  name: String,
  message: String,
  content: crate::object::Object,
) -> ZomeApiResult<CreatedCommitResponse> {
  let context_address = create_context_entry(name)?;

  // Create main starting branch and link it to the newly created context
  let branch_address =
    crate::branch::create_new_empty_branch(&context_address, String::from("master"))?;
  link_branch_to_context(&context_address, &branch_address)?;

  let commit_address =
    crate::branch::handle_create_commit(branch_address.clone(), message, content)?;

  Ok(CreatedCommitResponse {
    context_address: context_address,
    branch_address: branch_address,
    commit_address: commit_address,
  })
}

/**
 * Returns the commit history from all the branches from the given context
 */
pub fn handle_get_context_history(context_address: Address) -> ZomeApiResult<Vec<GetEntryResult>> {
  let context_branches = handle_get_context_branches(context_address)?;
  Ok(
    context_branches
      .addresses()
      .into_iter()
      .flat_map(|branch_address| {
        let branch_history = crate::branch::get_branch_history(branch_address.to_owned()).unwrap();
        branch_history.into_iter()
      })
      .collect(),
  )
}

/** Helper functions */

pub fn create_context_entry(name: String) -> ZomeApiResult<Address> {
  // Create context
  let context_entry = Entry::App(
    "context".into(),
    Context::new(&name, "now", &AGENT_ADDRESS).into(),
  );
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
 * Links the given branch to the given repository as an active branch
 */
pub fn link_branch_to_context(
  context_address: &Address,
  branch_address: &Address,
) -> ZomeApiResult<()> {
  hdk::link_entries(context_address, branch_address, "active_branches")
}
