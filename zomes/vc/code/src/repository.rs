use boolinator::Boolinator;
use hdk::{
  entry_definition::ValidatingEntryType,
  error::ZomeApiResult,
  holochain_core_types::{
    cas::content::Address,
    dna::entry_types::Sharing,
    entry::Entry,
    error::HolochainError,
    json::JsonString,
  },
};

#[derive(Serialize, Deserialize, Debug, DefaultJson)]
pub struct Repository {
  name: String,
}

impl Repository {
  fn new(name: &str) -> Repository {
    Repository {
      name: name.to_owned(),
    }
  }
}

pub fn definition() -> ValidatingEntryType {
  entry!(
    name: "repository",
    description: "a repository containing branches",
    sharing: Sharing::Public,
    native_type: Repository,

    validation_package: || {
      hdk::ValidationPackageDefinition::ChainFull
    },

    validation: |repository: Repository, _ctx: hdk::ValidationData| {
      Ok(())
    },

    links: [
      to!(
        "branches",
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

/**
 * Create a new repository with the given name
 */
pub fn handle_create_repository(name: String) -> ZomeApiResult<Address> {
  let repository_entry = Entry::App("repository".into(), Repository::new(&name).into());

  hdk::commit_entry(&repository_entry)
}

/**
 * Creates a new branch in the given repository with the head pointint to the given commit
 */
pub fn handle_create_branch_in_repository(
  repository_address: Address,
  commit_address: Address,
  name: String,
) -> ZomeApiResult<Address> {
  let branch_address = crate::branch::create_new_branch(commit_address, name)?;

  hdk::link_entries(&repository_address, &branch_address, "active_branches")?;

  Ok(branch_address)
}
