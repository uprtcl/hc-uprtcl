#![feature(try_from)]
#[macro_use]
extern crate hdk;
extern crate serde;
#[macro_use]
extern crate serde_derive;
#[macro_use]
extern crate serde_json;
#[macro_use]
extern crate holochain_core_types_derive;

use hdk::error::ZomeApiResult;
use hdk::holochain_core_types::{cas::content::Address, error::HolochainError, json::JsonString};

pub mod lens;
pub mod utils;

define_zome! {
  entries: [
    lens::definition()
  ]

  genesis: || { Ok(()) }

  functions: [
    get_lens: {
      inputs: |entry_address: Address|,
      outputs: |result: ZomeApiResult<Option<lens::Lens>>|,
      handler: lens::handle_get_lens
    }
    set_lens: {
      inputs: |entry_address: Address, lens: String|,
      outputs: |result: ZomeApiResult<()>|,
      handler: lens::handle_set_lens
    }
  ]

  traits: {
    hc_public [get_lens,set_lens]
  }
}
