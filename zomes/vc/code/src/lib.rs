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
  holochain_core_types::{cas::content::Address, entry::Entry},
};

// see https://developer.holochain.org/api/0.0.2/hdk/ for info on using the hdk library

pub mod blob;
pub mod branch;
pub mod commit;
pub mod context;
pub mod tree;
pub mod utils;

define_zome! {
  entries: [
    blob::definition(),
    tree::definition(),
    commit::definition(),
    branch::definition(),
    context::definition()
  ]

  genesis: || { Ok(()) }

  functions: {
    main (Public) {
      // Repositories
      create_context: {
        inputs: |name: String|,
        outputs: |result: ZomeApiResult<Address>|,
        handler: context::handle_create_context
      }

      get_context_info: {
        inputs: |context_address: Address|,
        outputs: |result: ZomeApiResult<Option<Entry>>|,
        handler: context::handle_get_context_info
      }

      create_branch_in_context: {
        inputs: |context_address: Address, commit_address: Address, name: String|,
        outputs: |result: ZomeApiResult<Address>|,
        handler: context::handle_create_branch_in_context
      }

      get_context_branches: {
        inputs: |context_address: Address|,
        outputs: |result: ZomeApiResult<Vec<ZomeApiResult<Entry>>>|,
        handler: context::handle_get_context_branches
      }

      create_commit: {
        inputs: |branch_address: Address, message: String, content: commit::CommitContent|,
        outputs: |result: ZomeApiResult<Address>|,
        handler: branch::handle_create_commit
      }

      get_commit_info: {
        inputs: |commit_address: Address|,
        outputs: |result: ZomeApiResult<Option<Entry>>|,
        handler: commit::handle_get_commit_info
      }

      get_commit_content: {
        inputs: |commit_address: Address|,
        outputs: |result: ZomeApiResult<Option<Entry>>|,
        handler: commit::handle_get_commit_content
      }

    }
  }
}
