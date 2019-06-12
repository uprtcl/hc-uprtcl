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

use hdk::error::ZomeApiResult;
use hdk::holochain_core_types::{cas::content::Address, error::HolochainError, json::JsonString};

pub mod sources;
pub mod utils;

define_zome! {
  entries: [
    sources::definition()
  ]

  genesis: || { Ok(()) }

  functions: [
    get_own_source: {
      inputs: | |,
      outputs: |result: ZomeApiResult<String>|,
      handler: sources::handle_get_own_source
    }
    get_known_sources: {
      inputs: |address: Address|,
      outputs: |result: ZomeApiResult<Vec<String>>|,
      handler: sources::handle_get_known_sources
    }
    add_known_sources: {
      inputs: |address: Address, sources: Vec<String>|,
      outputs: |result: ZomeApiResult<()>|,
      handler: sources::handle_add_known_sources
    }
    remove_known_source: {
      inputs: |address: Address, source: String|,
      outputs: |result: ZomeApiResult<()>|,
      handler: sources::handle_remove_known_sources
    }
  ]

  traits: {
    hc_public [get_own_source,get_known_sources,add_known_sources, remove_known_source]
  }
}
