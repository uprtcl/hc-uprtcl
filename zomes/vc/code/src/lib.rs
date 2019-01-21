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
pub mod repository;
pub mod tree;

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
      // Repositories
      create_repository: {
        inputs: |name: String|,
        outputs: |result: ZomeApiResult<Address>|,
        handler: repository::handle_create_repository
      }

      get_repository_info: {
        inputs: |repository_address: Address|,
        outputs: |result: ZomeApiResult<Option<Entry>>|,
        handler: repository::handle_get_repository_info
      }

      create_branch_in_repository: {
        inputs: |repository_address: Address, commit_address: Address, name: String|,
        outputs: |result: ZomeApiResult<Address>|,
        handler: repository::handle_create_branch_in_repository
      }

      get_repository_branches: {
        inputs: |repository_address: Address|,
        outputs: |result: ZomeApiResult<Vec<ZomeApiResult<Entry>>>|,
        handler: repository::handle_get_repository_branches
      }

      create_commit: {
        inputs: |branch_address: Address, message: String, content: tree::CommitContent|,
        outputs: |result: ZomeApiResult<Address>|,
        handler: branch::handle_create_commit
      }

      get_commit_info: {
        inputs: |commit_address: Address|,
        outputs: |result: ZomeApiResult<Option<Entry>>|,
        handler: commit::handle_get_commit_info
      }

/*        get_commit_contents: {
        inputs: |commit_address: Address|,
        outputs: |result: ZomeApiResult<Option<tree::CommitContent>>|,
        handler: commit::handle_get_commit_contents
      }
 */
    }
  }
}
