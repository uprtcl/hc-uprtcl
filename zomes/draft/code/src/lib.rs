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
    error::ZomeApiResult,
    holochain_core_types::{
        cas::content::{Address, Content},
        error::HolochainError,
        json::JsonString,
    },
};

pub mod draft;
pub mod workspace;
pub mod utils;

define_zome! {
    entries: [
       draft::definition(),
       workspace::definition()
    ]

    genesis: || { Ok(()) }

    functions: [
        set_draft: {
            inputs: |entry_address: Address, draft: Option<Content>|,
            outputs: |result: ZomeApiResult<()>|,
            handler: draft::handle_set_draft
        }
        get_draft: {
            inputs: |entry_address: Address|,
            outputs: |result: ZomeApiResult<Content>|,
            handler: draft::handle_get_draft
        }
    ]

    traits: {
        hc_public [set_draft,get_draft]
    }
}
