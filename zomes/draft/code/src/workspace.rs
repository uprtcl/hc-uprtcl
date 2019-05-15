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
    AGENT_ADDRESS,
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
    
        links: []
    )
}

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
