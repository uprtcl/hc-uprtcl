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
    json::JsonString, validation::EntryValidationData,
};
use hdk::{entry_definition::ValidatingEntryType, error::ZomeApiResult, PUBLIC_TOKEN};
use holochain_wasm_utils::api_serialization::get_entry::{GetEntryOptions, GetEntryResult};
use std::convert::TryFrom;
use cid::{Cid, Codec, Version, ToCid};

// see https://developer.holochain.org/api/latest/hdk/ for info on using the hdk library

// This is a sample zome that defines an entry type "MyEntry" that can be committed to the
// agent's chain via the exposed function create_my_entry

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Folder {
    name: String,
    links: HashMap<String, Address>,
}

impl Folder {
    fn new(name: String) -> Folder {
        Folder {
            name: name.to_owned(),
            links: HashMap::new(),
        }
    }
}

pub fn handle_create_folder(folder: Folder) -> ZomeApiResult<Address> {
    let entry = Entry::App("folder".into(), folder.into());
    let address = hdk::commit_entry(&entry)?;

    Ok(address)
}

pub fn handle_get_folder(address: Address) -> ZomeApiResult<GetEntryResult> {
    hdk::get_entry_result(&address, GetEntryOptions::default())
}

fn definition() -> ValidatingEntryType {
    entry!(
        name: "folder",
        description: "this is a same entry defintion",
        sharing: Sharing::Public,
        validation_package: || {
            hdk::ValidationPackageDefinition::Entry
        },

        validation: | _validation_data: hdk::EntryValidationData<Folder>| {
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
        create_folder: {
            inputs: |folder: Folder|,
            outputs: |result: ZomeApiResult<Address>|,
            handler: handle_create_folder
        }
        get_folder: {
            inputs: |address: Address|,
            outputs: |result: ZomeApiResult<GetEntryResult>|,
            handler: handle_get_folder
        }
    ]

    traits: {
        hc_public [create_folder,get_folder]
    }
}
