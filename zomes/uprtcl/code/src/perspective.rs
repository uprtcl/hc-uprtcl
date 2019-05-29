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
  origin: String,
  timestamp: u128,
  creator: Address,
  context_address: Address,
}

impl Perspective {
  fn new(
    name: &str,
    timestamp: &u128,
    creator: &Address,
    context_address: &Address,
  ) -> Perspective {
    Perspective {
      name: name.to_owned(),
      timestamp: timestamp.to_owned(),
      origin: crate::utils::get_origin(),
      creator: creator.to_owned(),
      context_address: context_address.to_owned(),
    }
  }
}

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct ClonedPerspective {
  name: String,
  creator: Address,
  timestamp: u128,
  origin: String,
  context_address: Address,
  head_address: Address,
}

impl ClonedPerspective {
  fn to_perspective(&self) -> Perspective {
    Perspective {
      name: self.name.to_owned(),
      timestamp: self.timestamp.to_owned(),
      origin: self.origin.to_owned(),
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
        link_type: "head",
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
  head_address: Option<Address>,
) -> ZomeApiResult<Address> {
  let perspective_entry = Entry::App(
    "perspective".into(),
    Perspective::new(&name, &timestamp, &AGENT_ADDRESS, &context_address).into(),
  );
  let perspective_address = hdk::commit_entry(&perspective_entry)?;

  if let Some(head) = head_address {
    hdk::link_entries(&perspective_address, &head, "head", "")?;
  }

  link_perspective_to_context(&context_address, &perspective_address)?;

  Ok(perspective_address)
}

/**
 * Clones the given perspective, linking it with the appropiate context and commit
 */
pub fn handle_clone_perspective(cloned_perspective: ClonedPerspective) -> ZomeApiResult<Address> {
  let perspective_entry = Entry::App(
    "perspective".into(),
    cloned_perspective.to_perspective().into(),
  );
  let perspective_address = hdk::commit_entry(&perspective_entry)?;

  hdk::link_entries(
    &perspective_address,
    &cloned_perspective.head_address,
    "head",
    "",
  )?;

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
  let links_result = hdk::get_links(&perspective_address, Some(String::from("head")), None)?;

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
  let previous_head = hdk::get_links(&perspective_address, Some(String::from("head")), None)?;
  if previous_head.addresses().len() != 0 {
    hdk::remove_link(
      &perspective_address,
      &previous_head.addresses().first().unwrap(),
      "head",
      "",
    )?;
  }

  hdk::link_entries(&perspective_address, &head_address, "head", "")?;

  Ok(())
}

/** Helper functions */

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
  hdk::link_entries(context_address, perspective_address, "perspectives", "")
}
