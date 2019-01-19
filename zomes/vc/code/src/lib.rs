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
pub mod tree;
pub mod commit;
pub mod branch;
pub mod repository;

define_zome! {
  entries: [
    blob::definition(),
    tree::definition(),
    commit::definition(),
    branch::definition(),
    repository::definition()
  ]

  genesis: || { Ok(()) }

  functions: {
    main (Public) {
      create_repository: {
        inputs: |name: String|,
        outputs: |result: ZomeApiResult<Address>|,
        handler: repository::handle_create_repository
      }

      create_branch_in_repository: {
        inputs: |repository_address: Address, commit_address: Address, name: String|,
        outputs: |result: ZomeApiResult<Address>|,
        handler: repository::handle_create_branch_in_repository
      }

      create_commit: {
        inputs: |branch_address: Address, message: String, content: tree::CommitTree|,
        outputs: |result: ZomeApiResult<Address>|,
        handler: branch::handle_create_commit
      }

      get_commit_info: {
        inputs: |commit_address: Address|,
        outputs: |result: ZomeApiResult<Option<Entry>>|,
        handler: commit::handle_get_commit_info
      }

/*       get_commit_contents: {
        inputs: |commit_address: Address|,
        outputs: |result: ZomeApiResult<Option<tree::CommitTree>>|,
        handler: commit::handle_get_commit_contents
      }
 */    }
  }
}
