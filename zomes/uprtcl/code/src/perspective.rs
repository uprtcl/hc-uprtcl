use hdk::{
  entry_definition::ValidatingEntryType,
  error::{ZomeApiError, ZomeApiResult},
  holochain_core_types::{
    cas::content::Address, dna::entry_types::Sharing, entry::Entry, error::HolochainError,
    json::JsonString,
  },
  AGENT_ADDRESS,
};
use holochain_wasm_utils::api_serialization::get_entry::{GetEntryOptions, GetEntryResult};

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Perspective {
  name: String,
  creator: Address,
  context_address: Address,
}

impl Perspective {
  fn new(name: &str, creator: &Address, context_address: &Address) -> Perspective {
    Perspective {
      name: name.to_owned(),
      creator: creator.to_owned(),
      context_address: context_address.to_owned(),
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
  timestamp: u64,
  content_link: Address,
) -> ZomeApiResult<Address> {
  let parent_commit_address = hdk::get_links(&perspective_address, "head")?;

  let commit_address = crate::commit::create_commit_entry(
    message,
    timestamp,
    content_link,
    &parent_commit_address.addresses(),
  )?;

  set_perspective_head(&perspective_address, &commit_address)?;

  Ok(commit_address)
}

/**
 * Returns the address of the head commit for the given perspective
 */
pub fn handle_get_perspective_head(perspective_address: Address) -> ZomeApiResult<Address> {
  let links_result = hdk::get_links(&perspective_address, "head")?;

  if links_result.addresses().len() == 0 {
    return Err(ZomeApiError::from(String::from(
      "given perspective has no commits",
    )));
  }
  Ok(links_result.addresses().last().unwrap().to_owned())
}

/**
 * Creates a new perspective in the given context with the head pointing to the given commit
 */
pub fn handle_create_perspective(
  context_address: Address,
  name: String,
  head_link: Address,
) -> ZomeApiResult<Address> {
  let perspective_entry = Entry::App(
    "perspective".into(),
    Perspective::new(&name, &AGENT_ADDRESS, &context_address).into(),
  );
  let perspective_address = hdk::commit_entry(&perspective_entry)?;

  hdk::link_entries(&perspective_address, &head_link, "head")?;

  link_perspective_to_context(&context_address, &perspective_address)?;

  Ok(perspective_address)
}

#[derive(Serialize, Deserialize, Debug, DefaultJson)]
pub struct PerspectiveCreated {
  pub context_address: Address,
  pub perspective_address: Address,
  pub commit_address: Address,
}

/**
 * Creates a context, a perspective and a commit and return the addresses
 */
pub fn handle_create_perspective_and_content(
  context: crate::context::Context,
  name: String,
  head: crate::commit::Commit,
) -> ZomeApiResult<PerspectiveCreated> {
  let context_address = crate::context::handle_create_context(context)?;

  let commit_address = crate::commit::create_commit(head)?;

  // Create main starting perspective and link it to the newly created context
  let perspective_address =
    handle_create_perspective(context_address.clone(), name, commit_address.clone())?;

  Ok(PerspectiveCreated {
    context_address: context_address,
    perspective_address: perspective_address,
    commit_address: commit_address,
  })
}

/** Helper functions */

/**
 * Sets the given perspective head pointing to the given commit head
 */
pub fn set_perspective_head(
  perspective_address: &Address,
  commit_address: &Address,
) -> ZomeApiResult<Address> {
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
 * Returns the commit history for the given perspective
 */
pub fn get_perspective_history(perspective_address: Address) -> ZomeApiResult<Vec<GetEntryResult>> {
  let perspective_head = handle_get_perspective_head(perspective_address)?;
  crate::commit::get_commit_history(perspective_head)
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
