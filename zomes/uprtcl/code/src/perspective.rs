use hdk::{
  entry_definition::ValidatingEntryType,
  error::{ZomeApiError, ZomeApiResult},
  holochain_core_types::{
    cas::content::Address, dna::entry_types::Sharing, entry::Entry, error::HolochainError,
    json::JsonString,
  },
  AGENT_ADDRESS, PUBLIC_TOKEN,
};
use holochain_wasm_utils::api_serialization::{
  get_entry::{GetEntryOptions, GetEntryResult},
  get_links::GetLinksOptions,
};
use std::convert::TryFrom;

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

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct ClonedPerspective {
  name: String,
  creator: Address,
  context_address: Address,
  head_address: Address,
}

impl ClonedPerspective {
  fn to_perspective(&self) -> Perspective {
    Perspective {
      name: self.name.to_owned(),
      creator: self.creator.to_owned(),
      context_address: self.context_address.to_owned(),
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
      ),
      from!(
        "%agent_id",
        tag: "root",
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
 * Creates a new perspective in the given context with the head pointing to the given commit
 */
pub fn handle_create_perspective(
  context_address: Address,
  name: String,
  timestamp: u128,
  head_address: Address,
) -> ZomeApiResult<Address> {
  let perspective_entry = Entry::App(
    "perspective".into(),
    Perspective::new(&name, &AGENT_ADDRESS, &context_address).into(),
  );
  let perspective_address = hdk::commit_entry(&perspective_entry)?;

  hdk::link_entries(&perspective_address, &head_address, "head")?;

  link_perspective_to_context(&context_address, &perspective_address)?;

  Ok(perspective_address)
}

/**
 * Clones the given perspective, linking it with the appropiate context and commit
 */
pub fn handle_clone_perspective(cloned_perspective: ClonedPerspective) -> ZomeApiResult<Address> {
  let perspective_entry = Entry::App("perspective".into(), cloned_perspective.to_perspective().into());
  let perspective_address = hdk::commit_entry(&perspective_entry)?;

  hdk::link_entries(&perspective_address, &cloned_perspective.head_address, "head")?;

  link_perspective_to_context(&cloned_perspective.context_address, &perspective_address)?;

  Ok(perspective_address)
}

/**
 * Retrieves the information about the perspective
 */
pub fn handle_get_perspective_info(perspective_address: Address) -> ZomeApiResult<GetEntryResult> {
  hdk::get_entry_result(&perspective_address, GetEntryOptions::default())
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
 * Sets the given perspective head pointing to the given commit head
 */
pub fn handle_update_perspective_head(
  perspective_address: Address,
  head_address: Address,
) -> ZomeApiResult<()> {
  let previous_head = hdk::get_links(&perspective_address, "head")?;
  if previous_head.addresses().len() != 0 {
    hdk::remove_link(
      &perspective_address,
      &previous_head.addresses().first().unwrap(),
      "head",
    )?;
  }

  hdk::link_entries(&perspective_address, &head_address, "head")?;

  Ok(())
}

/**
 * Returns the root perspective of the agent, created at genesis time
 */
pub fn handle_get_root_perspective() -> ZomeApiResult<GetEntryResult> {
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
      create_root_perspective()?;
      handle_get_root_perspective()
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

/** Helper functions */

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct AddressResponse {
  Ok: Address,
}

/**
 * Creates the root perspective for the agent
 * Only to be called at genesis time
 */
pub fn create_root_perspective() -> ZomeApiResult<Address> {
  let links: Vec<Address> = Vec::new();
  let json_response = hdk::call(
    hdk::THIS_INSTANCE,
    "documents",
    Address::from(PUBLIC_TOKEN.to_string()),
    "create_text_node",
    json!({
      "node": {
        "text": "Hi",
        "links": links
      }
    })
    .into(),
  )?;
  let response = AddressResponse::try_from(json_response)?;

  let context_address = crate::context::create_context(crate::context::Context::root_context())?;
  let commit_address = crate::commit::create_initial_commit(&response.Ok)?;

  let perspective_address =
    handle_create_perspective(context_address, String::from("root"), 0, commit_address)?;

  hdk::link_entries(&AGENT_ADDRESS, &perspective_address, "root")?;

  Ok(perspective_address)
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
