#![feature(try_from)]
#[macro_use]
extern crate hdk;
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate serde_json;
#[macro_use]
extern crate holochain_core_types_derive;

use holochain_wasm_utils::api_serialization::get_entry::GetEntryResult;

use hdk::holochain_core_types::{
  cas::content::Address, error::HolochainError,
  json::JsonString,
};
use hdk::error::ZomeApiResult;

pub mod document;

define_zome! {
  entries: [
      document::definition()
  ]

  genesis: || { Ok(()) }

  functions: [

    get_document: {
      inputs: |address: Address|,
      outputs: |result: ZomeApiResult<GetEntryResult>|,
      handler: document::handle_get_document
    }

    save_document: {
      inputs: |title: String, content: String|,
      outputs: |result: ZomeApiResult<Address>|,
      handler: document::handle_save_document
    }

  ]

  traits: {
    hc_public [get_document, save_document]
  }
}
