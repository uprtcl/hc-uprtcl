#![feature(try_from)]
#[macro_use]
extern crate hdk;
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate serde_json;
#[macro_use]
extern crate holochain_core_types_derive;

use hdk::holochain_core_types::{
  cas::content::Address, dna::entry_types::Sharing, entry::Entry, error::HolochainError,
  json::JsonString,
};
use hdk::{entry_definition::ValidatingEntryType, error::ZomeApiResult};

pub mod note;

define_zome! {
  entries: [
      note::definition()
  ]

  genesis: || { Ok(()) }

  functions: [
    create_note: {
      inputs: |title: String, content: String|,
      outputs: |result: ZomeApiResult<Address>|,
      handler: note::handle_create_note
    }
    get_note: {
      inputs: |address: Address|,
      outputs: |result: ZomeApiResult<Option<Entry>>|,
      handler: note::handle_get_note
    }
  ]

  capabilities: {
    public (Public) [create_note,get_note]
  }
}
