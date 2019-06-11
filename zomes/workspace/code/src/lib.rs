#![feature(try_from)]
#[macro_use]
extern crate hdk;
extern crate serde;
#[macro_use]
extern crate serde_json;
#[macro_use]
extern crate serde_derive;
#[macro_use]
extern crate holochain_core_types_derive;

use hdk::error::ZomeApiResult;
use hdk::holochain_core_types::{
    cas::content::Address, entry::Entry, error::HolochainError, json::JsonString,
};

pub mod utils;
pub mod workspace;

define_zome! {
    entries: [
       workspace::definition()
    ]

    genesis: || { Ok(()) }

    functions: [
        get_or_create_workspace: {
            inputs: |entry_address: Address|,
            outputs: |result: ZomeApiResult<Address>|,
            handler: workspace::handle_get_or_create_workspace
        }
        get_workspace: {
            inputs: |entry_address: Address|,
            outputs: |result: ZomeApiResult<Option<Address>>|,
            handler: workspace::handle_get_workspace
        }
    ]

    traits: {
        hc_public [get_or_create_workspace,get_workspace]
    }
}
