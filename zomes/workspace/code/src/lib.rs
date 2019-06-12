#![feature(try_from)]
#[macro_use]
extern crate hdk;
extern crate serde;
#[macro_use]
extern crate serde_json;
#[macro_use]
extern crate serde_derive;
#[macro_use]
extern crate holochain_core_types_derive;

use hdk::error::ZomeApiResult;
use hdk::holochain_core_types::{cas::content::Address, error::HolochainError, json::JsonString};

pub mod utils;
pub mod workspace;

define_zome! {
  entries: [
    workspace::definition()
  ]

  genesis: || { Ok(()) }

  functions: [
    get_or_create_workspace: {
      inputs: |entry_address: Address|,
      outputs: |result: ZomeApiResult<Address>|,
      handler: workspace::handle_get_or_create_workspace
    }
    get_my_workspace: {
      inputs: |entry_address: Address|,
      outputs: |result: ZomeApiResult<Option<Address>>|,
      handler: workspace::handle_get_my_workspace
    }
    get_entry_workspace: {
      inputs: |entry_address: Address|,
      outputs: |result: ZomeApiResult<Option<Address>>|,
      handler: workspace::handle_get_entry_workspace
    }
    get_all_workspaces: {
      inputs: |entry_address: Address|,
      outputs: |result: ZomeApiResult<Vec<Address>>|,
      handler: workspace::handle_get_all_workspaces
    }
  ]

  traits: {
    hc_public [get_or_create_workspace,get_my_workspace,get_entry_workspace,get_all_workspaces]
  }
}
