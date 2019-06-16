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

pub mod utils;

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct TextNode {
    text: String,
    r#type: String,
    links: Vec<Address>,
}

pub fn handle_create_text_node(
    previous_address: Option<Address>,
    node: TextNode
) -> ZomeApiResult<Address> {
    let entry = Entry::App("text_node".into(), node.into());
    let address = hdk::commit_entry(&entry)?;

    if let Some(proxy_address) = previous_address {
        utils::set_entry_proxy(proxy_address, Some(address.clone()))?;
    }

    Ok(address)
}

fn definition() -> ValidatingEntryType {
    entry!(
        name: "text_node",
        description: "this is a same entry defintion",
        sharing: Sharing::Public,
        validation_package: || {
            hdk::ValidationPackageDefinition::Entry
        },

        validation: | _validation_data: hdk::EntryValidationData<TextNode>| {
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
        create_text_node: {
            inputs: |previous_address: Option<Address>, node: TextNode|,
            outputs: |result: ZomeApiResult<Address>|,
            handler: handle_create_text_node
        }
    ]

    traits: {
        hc_public [create_text_node]
    }
}
