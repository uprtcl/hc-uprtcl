#![feature(try_from)]
#[macro_use]
extern crate hdk;
extern crate serde;
#[macro_use]
extern crate serde_derive;
#[macro_use]
extern crate serde_json;
#[macro_use]
extern crate holochain_core_types_derive;

use hdk::{
    entry_definition::ValidatingEntryType,
    error::{ZomeApiError, ZomeApiResult},
    holochain_core_types::{
        cas::content::{Address, AddressableContent, Content},
        dna::entry_types::Sharing,
        entry::Entry,
        error::HolochainError,
        json::JsonString,
    },
    AGENT_ADDRESS,
};

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Draft {
    draft: Content,
}

impl Draft {
    fn new(draft: Content) -> Draft {
        Draft {
            draft: draft.to_owned(),
        }
    }
}

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

fn workspace_entry(entry_address: Address) -> Entry {
    Entry::App("workspace".into(), Workspace::from(entry_address).into())
}

fn workspace_address(entry_address: Address) -> ZomeApiResult<Address> {
    hdk::entry_address(&workspace_entry(entry_address))
}

/**
 * Removes the previous draft from the workspace
 */
fn remove_previous_draft(entry_address: &Address) -> ZomeApiResult<()> {
    let workspace_address = workspace_address(entry_address.clone())?;
    let links = hdk::get_links(&workspace_address, "draft")?;

    if links.addresses().len() > 0 {
        hdk::remove_link(&workspace_address, &links.addresses()[0], "draft")?;
        hdk::remove_entry(&links.addresses()[0])?;
    }

    Ok(())
}

/**
 * Removes the previous draft if existed,
 * creates or uses the user's workspace for given entry and
 * stores the given draft
 */
pub fn handle_set_draft(entry_address: Address, draft: Content) -> ZomeApiResult<Address> {
    remove_previous_draft(&entry_address)?;

    let entry = Entry::App("draft".into(), Draft::new(draft).into());
    let address = hdk::commit_entry(&entry)?;

    let workspace = workspace_entry(entry_address);
    let workspace_address = hdk::commit_entry(&workspace)?;

    hdk::link_entries(&workspace_address, &address, "draft")?;

    Ok(address)
}

fn not_found_result() -> Content {
    json!({
        "message": "entry has no drafts"
    })
    .into()
}

/**
 * Returns the draft for the given entry_address, failing if it didn't exist
 */
pub fn handle_get_draft(entry_address: Address) -> ZomeApiResult<Content> {
    let workspace_address = workspace_address(entry_address)?;

    match hdk::get_entry(&workspace_address)? {
        None => Ok(not_found_result()),
        Some(_) => {
            let links = hdk::get_links_and_load(&workspace_address, "draft")?;

            if links.len() == 0 {
                return Ok(not_found_result());
            }

            Ok(links[0].to_owned().unwrap().content())
        }
    }
}

fn definition() -> ValidatingEntryType {
    entry!(
        name: "draft",
        description: "this is a same entry defintion",
        sharing: Sharing::Public,
        validation_package: || {
            hdk::ValidationPackageDefinition::Entry
        },

        validation: | _validation_data: hdk::EntryValidationData<Draft>| {
            Ok(())
        },

        links: [
            to!(
                "draft",
                tag: "draft",
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

define_zome! {
    entries: [
       definition()
    ]

    genesis: || { Ok(()) }

    functions: [
        set_draft: {
            inputs: |entry_address: Address, draft: Content|,
            outputs: |result: ZomeApiResult<Address>|,
            handler: handle_set_draft
        }
        get_draft: {
            inputs: |entry_address: Address|,
            outputs: |result: ZomeApiResult<Content>|,
            handler: handle_get_draft
        }
    ]

    traits: {
        hc_public [set_draft,get_draft]
    }
}
