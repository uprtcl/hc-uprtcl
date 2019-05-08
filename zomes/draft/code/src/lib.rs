#![feature(try_from)]
#[macro_use]
extern crate hdk;
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate serde_json;
#[macro_use]
extern crate holochain_core_types_derive;

use hdk::holochain_core_types::cas::content::AddressableContent;
use hdk::holochain_core_types::{
    cas::content::{Address, Content},
    dna::entry_types::Sharing,
    entry::Entry,
    error::HolochainError,
    json::JsonString,
};
use hdk::{
    entry_definition::ValidatingEntryType,
    error::{ZomeApiError, ZomeApiResult},
};

// see https://developer.holochain.org/api/0.0.14-alpha1/hdk/ for info on using the hdk library

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

fn remove_previous_draft(entry_address: Address) -> ZomeApiResult<()> {
    let links = hdk::get_links(&entry_address, "draft")?;

    if links.addresses().len() > 0 {
        hdk::remove_link(&entry_address, &links.addresses()[0], "draft")?;
        hdk::remove_entry(&links.addresses()[0])?;
    }

    Ok(())
}

pub fn handle_set_draft(entry_address: Address, draft: Content) -> ZomeApiResult<Address> {
    let entry = Entry::App("draft".into(), Draft::new(draft).into());
    let address = hdk::commit_entry(&entry)?;

    hdk::link_entries(&entry_address, &address, "draft")?;

    Ok(address)
}

pub fn handle_get_draft(entry_address: Address) -> ZomeApiResult<Content> {
    let links = hdk::get_links_and_load(&entry_address, "draft")?;

    if links.len() == 0 {
        return Err(ZomeApiError::from(String::from("entry has no drafts")));
    }

    Ok(links[0].to_owned().unwrap().content())
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
