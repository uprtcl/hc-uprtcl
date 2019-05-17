#![feature(try_from)]
#![warn(unused_extern_crates)]
#[macro_use]
extern crate hdk;
#[macro_use]
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate boolinator;
#[macro_use]
extern crate serde_json;
#[macro_use]
extern crate holochain_core_types_derive;

use hdk::{
  error::ZomeApiResult,
  holochain_core_types::{cas::content::Address, error::HolochainError, json::JsonString},
};
use holochain_wasm_utils::api_serialization::{
  get_entry::{GetEntryOptions, GetEntryResult},
  get_links::GetLinksResult,
};

// see https://developer.holochain.org/api/latest/hdk/ for info on using the hdk library

pub mod commit;
pub mod context;
pub mod perspective;
pub mod utils;

/** Exposed zome functions */

pub fn handle_get_entry(address: Address) -> ZomeApiResult<GetEntryResult> {
  hdk::get_entry_result(&address, GetEntryOptions::default())
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

    get_entry: {
      inputs: |address: Address|,
      outputs: |result: ZomeApiResult<GetEntryResult>|,
      handler: handle_get_entry
    }

    // Contexts
    create_context: {
      inputs: |context: context::Context|,
      outputs: |result: ZomeApiResult<Address>|,
      handler: context::handle_create_context
    }

    get_root_context: {
      inputs: | |,
      outputs: |result: ZomeApiResult<GetEntryResult>|,
      handler: context::handle_get_root_context
    }

    get_created_contexts: {
      inputs: | |,
      outputs: |result: ZomeApiResult<Vec<ZomeApiResult<GetEntryResult>>>|,
      handler: context::handle_get_created_contexts
    }

    get_all_contexts: {
      inputs: | |,
      outputs: |result: ZomeApiResult<Vec<ZomeApiResult<GetEntryResult>>>|,
      handler: context::handle_get_all_contexts
    }

    get_context_info: {
      inputs: |context_address: Address|,
      outputs: |result: ZomeApiResult<GetEntryResult>|,
      handler: context::handle_get_context_info
    }

    get_context_history: {
      inputs: |context_address: Address|,
      outputs: |result: ZomeApiResult<Vec<GetEntryResult>>|,
      handler: context::handle_get_context_history
    }

    get_context_address: {
      inputs: |context: context::Context|,
      outputs: |result: ZomeApiResult<Address>|,
      handler: context::handle_get_context_address
    }

    // Perspectives
    create_perspective: {
      inputs: |context_address: Address, name: String, head_link: Address|,
      outputs: |result: ZomeApiResult<Address>|,
      handler: perspective::handle_create_perspective
    }

    get_context_perspectives: {
      inputs: |context_address: Address|,
      outputs: |result: ZomeApiResult<GetLinksResult>|,
      handler: context::handle_get_context_perspectives
    }

    get_perspective_info: {
      inputs: |perspective_address: Address|,
      outputs: |result: ZomeApiResult<GetEntryResult>|,
      handler: perspective::handle_get_perspective_info
    }

    get_perspective_head: {
      inputs: |perspective_address: Address|,
      outputs: |result: ZomeApiResult<Address>|,
      handler: perspective::handle_get_perspective_head
    }

    // Commits
    create_commit: {
      inputs: |perspective_address: Address, message: String, timestamp: u64, content_link: Address|,
      outputs: |result: ZomeApiResult<Address>|,
      handler: perspective::handle_create_commit
    }

    get_commit_info: {
      inputs: |commit_address: Address|,
      outputs: |result: ZomeApiResult<GetEntryResult>|,
      handler: commit::handle_get_commit_info
    }

    create_perspective_and_content: {
      inputs: |context: context::Context, name: String, head: commit::Commit|,
      outputs: |result: ZomeApiResult<perspective::PerspectiveCreated>|,
      handler: perspective::handle_create_perspective_and_content
    }

  ]

  traits: {
    hc_public [
      get_entry, create_context, get_root_context, get_created_contexts, get_all_contexts, get_context_info, get_context_history,
      create_perspective, get_context_perspectives, get_perspective_info, get_perspective_head, create_commit,
      get_commit_info, create_perspective_and_content
    ]
  }

}
