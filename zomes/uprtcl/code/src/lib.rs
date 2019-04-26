#![feature(try_from)]

#[macro_use]
extern crate hdk;
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate boolinator;
extern crate serde_json;
#[macro_use]
extern crate holochain_core_types_derive;

use hdk::{
  error::ZomeApiResult,
  holochain_core_types::{cas::content::Address, error::HolochainError, json::JsonString},
};
use holochain_wasm_utils::api_serialization::{
  get_entry::GetEntryResult, get_links::GetLinksResult,
};

// see https://developer.holochain.org/api/0.0.2/hdk/ for info on using the hdk library

pub mod perspective;
pub mod commit;
pub mod context;
pub mod merge;
pub mod object;
pub mod utils;

define_zome! {
  entries: [
    object::definition(),
    commit::definition(),
    perspective::definition(),
    context::definition()
  ]

  genesis: || { Ok(()) }

  functions: [
    // Contexts
    create_context: {
      inputs: |name: String|,
      outputs: |result: ZomeApiResult<Address>|,
      handler: context::handle_create_context
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

    // Perspectives
    create_perspective: {
      inputs: |commit_address: Address, name: String|,
      outputs: |result: ZomeApiResult<Address>|,
      handler: context::handle_create_perspective_in_context
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

    merge_perspectives: {
      inputs: |from_perspective_address: Address, to_perspective_address: Address|,
      outputs: |result: ZomeApiResult<Address>|,
      handler: perspective::handle_merge_perspectives
    }

    // Commits
    create_commit: {
      inputs: |perspective_address: Address, message: String, content: object::Object|,
      outputs: |result: ZomeApiResult<Address>|,
      handler: perspective::handle_create_commit
    }

    get_commit_info: {
      inputs: |commit_address: Address|,
      outputs: |result: ZomeApiResult<GetEntryResult>|,
      handler: commit::handle_get_commit_info
    }

    get_commit_content: {
      inputs: |commit_address: Address|,
      outputs: |result: ZomeApiResult<GetEntryResult>|,
      handler: commit::handle_get_commit_content
    }

    create_context_and_commit: {
      inputs: |name: String, message: String, content: object::Object|,
      outputs: |result: ZomeApiResult<context::CreatedCommitResponse>|,
      handler: context::handle_create_context_and_commit
    }

    // Objects
    get_entry: {
      inputs: |address: Address|,
      outputs: |result: ZomeApiResult<GetEntryResult>|,
      handler: object::handle_get_entry
    }

  ]

  traits: {
    hc_public [
      create_context, get_created_contexts, get_all_contexts, get_context_info, get_context_history,
      create_perspective, get_context_perspectives, get_perspective_info, get_perspective_head, create_commit,
      get_commit_info, get_commit_content, merge_perspectives, create_context_and_commit, get_entry
    ]
  }

}
