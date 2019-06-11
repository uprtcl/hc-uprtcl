use hdk::{
  entry_definition::ValidatingEntryType,
  error::ZomeApiResult,
  holochain_core_types::{
    cas::content::Address, dna::entry_types::Sharing, entry::Entry, error::HolochainError,
    json::JsonString,
  },
  AGENT_ADDRESS, PUBLIC_TOKEN,
};

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Workspace {
  agent_address: Address,
  entry_address: Address,
}

impl Workspace {
  fn from(entry_address: Address) -> Workspace {
    Workspace {
      agent_address: AGENT_ADDRESS.to_owned(),
      entry_address: entry_address.to_owned(),
    }
  }
}

pub fn definition() -> ValidatingEntryType {
  entry!(
      name: "workspace",
      description: "a relation between a user and a working entry to do drafts",
      sharing: Sharing::Public,
      validation_package: || {
          hdk::ValidationPackageDefinition::Entry
      },

      validation: | _validation_data: hdk::EntryValidationData<Workspace>| {
          Ok(())
      },
      links: [
        from!(
          "proxy",
          link_type: "entry_workspace",
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

/** Handlers */

/**
 * Creates a new workspace for the current agent and the given address and returns it, if it didn't exist
 */
pub fn handle_get_or_create_workspace(entry_address: Address) -> ZomeApiResult<Address> {
  // Try to get directly the entry workspace
  match handle_get_workspace(entry_address.clone())? {
    Some(workspace_address) => Ok(workspace_address),
    None => {
      // Workspace does not exist, create it
      let workspace_address = workspace_address(entry_address.clone())?;

      // Create a proxy entry from the entry_address to be able to link workspaces for the same entry
      crate::utils::set_entry_proxy(entry_address.clone(), None)?;

      // Create the workspace
      hdk::commit_entry(&workspace_entry(entry_address.clone()))?;

      // Link the proxy for the entry address to the workspace
      let response = hdk::call(
        hdk::THIS_INSTANCE,
        "proxy",
        Address::from(PUBLIC_TOKEN.to_string()),
        "link_from_proxy",
        json!({"proxy_address": entry_address, "to_address": workspace_address.clone(), "link_type": "entry_workspace", "tag": ""}).into(),
      )?;

      // Return error if the response is not correct
      crate::utils::response_to_address(response)?;

      Ok(workspace_address)
    }
  }
}

/**
 * Returns the workspace for the given entry_address
 */
pub fn handle_get_workspace(entry_address: Address) -> ZomeApiResult<Option<Address>> {
  let workspace_address = workspace_address(entry_address)?;
  match hdk::get_entry(&workspace_address)? {
    None => Ok(None),
    Some(_) => Ok(Some(workspace_address)),
  }
}

/** Helpers */

/**
 * Retuns the workspace of the agent with the given entry address in an entry form
 */
pub fn workspace_entry(entry_address: Address) -> Entry {
  Entry::App("workspace".into(), Workspace::from(entry_address).into())
}

/**
 * Returns the entry address of the given workspace
 */
pub fn workspace_address(entry_address: Address) -> ZomeApiResult<Address> {
  hdk::entry_address(&workspace_entry(entry_address))
}
