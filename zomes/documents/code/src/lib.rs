#![feature(try_from)]
#[macro_use]
extern crate hdk;
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate serde_json;
#[macro_use]
extern crate holochain_core_types_derive;

use holochain_wasm_utils::api_serialization::get_links::GetLinksResult;
use hdk::holochain_core_types::{
  cas::content::Address, dna::entry_types::Sharing, entry::Entry, error::HolochainError,
  json::JsonString,
};
use hdk::{entry_definition::ValidatingEntryType, error::ZomeApiResult};

pub mod document;

define_zome! {
  entries: [
      document::definition()
  ]

  genesis: || { Ok(()) }

  functions: [
    create_document: {
      inputs: |title: String, content: String|,
      outputs: |result: ZomeApiResult<Address>|,
      handler: document::handle_create_document
    }

    get_document: {
      inputs: |address: Address|,
      outputs: |result: ZomeApiResult<Option<Entry>>|,
      handler: document::handle_get_document
    }

  ]

  capabilities: {
    public (Public) [create_document, get_document, get_my_documents]
  }
}
