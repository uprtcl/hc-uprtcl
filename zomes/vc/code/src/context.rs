use hdk::{
  entry_definition::ValidatingEntryType,
  error::ZomeApiResult,
  holochain_core_types::{
    cas::content::Address, dna::entry_types::Sharing, entry::Entry, error::HolochainError,
    json::JsonString,
  },
  AGENT_ADDRESS
};

#[derive(Serialize, Deserialize, Debug, DefaultJson)]
pub struct Context {
  name: String,
  date_created: String,
  created_by: Address
}

impl Context {
  fn new(name: &str, date_created: &str, created_by: &Address) -> Context {
    Context {
      name: name.to_owned(),
      date_created: date_created.to_owned(),
      created_by: created_by.to_owned()
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
  let context_entry = Entry::App("context".into(), Context::new(&name, "now", &AGENT_ADDRESS).into());
  let context_address = hdk::commit_entry(&context_entry)?;
  
  // Create main starting branch and link it to the newly created context
  let branch_address = crate::branch::create_new_empty_branch(&context_address, String::from("master"))?;
  link_branch_to_context(&context_address, &branch_address)?;

  Ok(context_address)
}

/**
 * Retrieves the information about the context
 */
pub fn handle_get_context_info(context_address: Address) -> ZomeApiResult<Option<Entry>> {
  hdk::get_entry(&context_address)
}

/**
 * Creates a new branch in the given context with the head pointing to the given commit
 */
pub fn handle_create_branch_in_context(
  context_address: Address,
  commit_address: Address,
  name: String,
) -> ZomeApiResult<Address> {
  let branch_address = crate::branch::create_new_branch(&context_address, commit_address, name)?;

  link_branch_to_context(&context_address, &branch_address)?;

  Ok(branch_address)
}

/**
 * Returns the branches of the context
 */
pub fn handle_get_context_branches(context_address: Address) -> ZomeApiResult<Vec<ZomeApiResult<Entry>>> {
  hdk::get_links_and_load(&context_address, "active_branches")
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
