#![feature(try_from)]
#![warn(unused_extern_crates)]
#[allow(non_snake_case)]
#[macro_use]
extern crate hdk;
#[macro_use]
extern crate serde_json;
#[macro_use]
extern crate serde_derive;
#[macro_use]
extern crate holochain_core_types_derive;

use hdk::DNA_ADDRESS;
use hdk::{
  error::ZomeApiResult,
  holochain_core_types::{
    cas::content::Address, error::HolochainError, json::JsonString, signature::Provenance,
  },
};
use holochain_wasm_utils::api_serialization::get_entry::{
  GetEntryOptions, GetEntryResult, StatusRequestKind,
};

pub mod commit;
pub mod context;
pub mod perspective;
pub mod utils;

/** Exposed zome functions */

pub fn get_origin() -> String {
  String::from("holochain://") + &String::from(DNA_ADDRESS.to_owned())
}

define_zome! {
  entries: [
    commit::definition(),
    perspective::definition(),
    context::definition()
  ]

  genesis: || {
    Ok(())
  }

  functions: [

    // Contexts
    create_context: {
      inputs: |previous_address: Option<Address>, context: context::Context|,
      outputs: |result: ZomeApiResult<Address>|,
      handler: context::handle_create_context
    }

    get_context_address: {
      inputs: |context: context::Context|,
      outputs: |result: ZomeApiResult<Address>|,
      handler: context::handle_get_context_address
    }

    // Perspectives
    create_perspective: {
      inputs: |previous_address: Option<Address>, perspective: perspective::Perspective|,
      outputs: |result: ZomeApiResult<Address>|,
      handler: perspective::handle_create_perspective
    }

    get_context_perspectives: {
      inputs: |context_address: Address|,
      outputs: |result: ZomeApiResult<Vec<ZomeApiResult<GetEntryResult>>>|,
      handler: context::handle_get_context_perspectives
    }

    get_perspective_head: {
      inputs: |perspective_address: Address|,
      outputs: |result: ZomeApiResult<Address>|,
      handler: perspective::handle_get_perspective_head
    }

    update_perspective_head: {
      inputs: |perspective_address: Address, head_address: Address|,
      outputs: |result: ZomeApiResult<()>|,
      handler: perspective::handle_update_perspective_head
    }

    // Commits
    create_commit: {
      inputs: |previous_address: Option<Address>, commit: commit::Commit|,
      outputs: |result: ZomeApiResult<Address>|,
      handler: commit::handle_create_commit
    }

  ]

  traits: {
    hc_public [
      create_context,
      create_perspective, get_context_perspectives, get_perspective_head, update_perspective_head,
      create_commit
    ]
  }

}
