#![feature(proc_macro_hygiene)]
#![allow(non_snake_case)]
#[macro_use]
extern crate hdk;
extern crate hdk_proc_macros;
extern crate serde;
#[macro_use]
extern crate serde_derive;
#[macro_use]
extern crate serde_json;
#[macro_use]
extern crate holochain_json_derive;
extern crate holochain_anchors;

use hdk::holochain_persistence_api::cas::content::Address;
use hdk::prelude::*;
use holochain_wasm_utils::api_serialization::get_entry::GetEntryResult;

use hdk_proc_macros::zome;

pub mod commit;
pub mod context;
pub mod perspective;
pub mod versioned_tags;
pub mod proof;
pub mod proxy;
pub mod utils;
pub mod perspective_details;

#[zome]
mod uprtcl {

    use perspective_details::PerspectiveDetails;

    #[init]
    fn init() {
        Ok(())
    }

    #[validate_agent]
    pub fn validate_agent(validation_data: EntryValidationData<AgentId>) {
        Ok(())
    }

    // Entry definitions

    #[entry_def]
    fn anchor_entry_def() -> ValidatingEntryType {
        holochain_anchors::anchor_definition()
    }

    #[entry_def]
    fn commit_entry_def() -> ValidatingEntryType {
        commit::definition()
    }

    #[entry_def]
    fn perspective_entry_def() -> ValidatingEntryType {
        perspective::definition()
    }

    #[zome_fn("hc_public")]
    fn get_cas_id() -> ZomeApiResult<String> {
        Ok(utils::get_cas_id())
    }

    // Create entries

    #[zome_fn("hc_public")]
    fn create_commit(
        dataId: Address,
        parentsIds: Vec<Address>,
        message: String,
        timestamp: u128,
    ) -> ZomeApiResult<Address> {
        commit::create_commit(dataId, parentsIds, message, timestamp)
    }

    #[zome_fn("hc_public")]
    fn create_perspective(name: String, timestamp: u128) -> ZomeApiResult<Address> {
        perspective::create_perspective(name, timestamp)
    }

    // Clone entries

    #[zome_fn("hc_public")]
    fn clone_commit(
        previous_address: Option<Address>,
        commit: commit::Commit,
    ) -> ZomeApiResult<Address> {
        utils::clone_entry(previous_address, commit)
    }

    #[zome_fn("hc_public")]
    fn clone_perspective(
        previous_address: Option<Address>,
        perspective: perspective::Perspective,
    ) -> ZomeApiResult<Address> {
        utils::clone_entry(previous_address, perspective)
    }

    // Getters

    #[zome_fn("hc_public")]
    fn get_perspective_details(perspective_address: Address) -> ZomeApiResult<PerspectiveDetails> {
        perspective_details::get_perspective_details(perspective_address)
    }

    #[zome_fn("hc_public")]
    fn get_context_perspectives(
        context: String,
    ) -> ZomeApiResult<Vec<ZomeApiResult<GetEntryResult>>> {
        context::get_context_perspectives(context)
    }

    // Setters
    #[zome_fn("hc_public")]
    fn update_perspective_details(
        perspective_address: Address,
        details: PerspectiveDetails,
    ) -> ZomeApiResult<()> {
        perspective_details::update_perspective_details(perspective_address, details)
    }

}
