#![feature(try_from)]
#![warn(unused_extern_crates)]
#[macro_use]
extern crate hdk;
#[macro_use]
extern crate serde;
#[macro_use]
extern crate serde_derive;
#[macro_use]
extern crate serde_json;
#[macro_use]
extern crate holochain_core_types_derive;

use hdk::holochain_core_types::{
    cas::content::Address, dna::entry_types::Sharing, entry::Entry, error::HolochainError,
    json::JsonString,
};
use hdk::{entry_definition::ValidatingEntryType, error::ZomeApiResult};
use holochain_wasm_utils::api_serialization::get_entry::{GetEntryOptions, GetEntryResult};

// see https://developer.holochain.org/api/latest/hdk/ for info on using the hdk library

// This is a sample zome that defines an entry type "MyEntry" that can be committed to the
// agent's chain via the exposed function create_my_entry

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct DocumentNode {
    text: String,
    links: HashMap<String, Address>,
}

pub fn handle_create_document_node(node: DocumentNode) -> ZomeApiResult<Address> {
    let entry = Entry::App("document_node".into(), node.into());
    let address = hdk::commit_entry(&entry)?;

    Ok(address)
}

pub fn handle_get_document_node(address: Address) -> ZomeApiResult<GetEntryResult> {
    hdk::get_entry_result(&address, GetEntryOptions::default())
}

fn definition() -> ValidatingEntryType {
    entry!(
        name: "document_node",
        description: "this is a same entry defintion",
        sharing: Sharing::Public,
        validation_package: || {
            hdk::ValidationPackageDefinition::Entry
        },

        validation: | _validation_data: hdk::EntryValidationData<DocumentNode>| {
            Ok(())
        }
    )
}

define_zome! {
    entries: [
       definition()
    ]

    genesis: || { Ok(()) }

    functions: [
        create_document_node: {
            inputs: |node: DocumentNode|,
            outputs: |result: ZomeApiResult<Address>|,
            handler: handle_create_document_node
        }
        get_document_node: {
            inputs: |address: Address|,
            outputs: |result: ZomeApiResult<GetEntryResult>|,
            handler: handle_get_document_node
        }
    ]

    traits: {
        hc_public [create_document_node,get_document_node]
    }
}
