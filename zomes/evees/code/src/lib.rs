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

use hdk::holochain_persistence_api::cas::content::Address;
use hdk::{entry_definition::ValidatingEntryType, error::ZomeApiResult};
use holochain_wasm_utils::api_serialization::get_entry::GetEntryResult;

use hdk_proc_macros::zome;

pub mod commit;
pub mod context;
pub mod perspective;
pub mod name;
pub mod proof;
pub mod proposal;
pub mod utils;

#[zome]
mod evees_zome {

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
    fn commit_entry_def() -> ValidatingEntryType {
        commit::definition()
    }

    #[entry_def]
    fn perspective_entry_def() -> ValidatingEntryType {
        perspective::definition()
    }

    #[entry_def]
    fn context_entry_def() -> ValidatingEntryType {
        context::definition()
    }

    #[entry_def]
    fn name_entry_def() -> ValidatingEntryType {
        name::definition()
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
    fn get_perspective_details(perspective_address: Address) -> ZomeApiResult<perspective::PerspectiveDetails> {
        let head = perspective::get_perspective_head(perspective_address.clone())?;
        let name = name::get_perspective_name(perspective_address.clone(),)?;
        let context = context::get_perspective_context(perspective_address)?;

        Ok(perspective::PerspectiveDetails {
            headId: head,
            name,
            context
        })
    }

    #[zome_fn("hc_public")]
    fn get_context_perspectives(
        context: String,
    ) -> ZomeApiResult<Vec<ZomeApiResult<GetEntryResult>>> {
        context::get_context_perspectives(context)
    }

    // Setters
    #[zome_fn("hc_public")]
    fn update_perspective_details(perspective_address: Address, details: perspective::PerspectiveDetails) -> ZomeApiResult<()> {

        if let Some(head_address) = details.headId {
            perspective::update_perspective_head(perspective_address.clone(), head_address)?;
        }

        if let Some(context) = details.context {
            context::update_perspective_context(perspective_address.clone(), context)?;
        }

        if let Some(name) = details.name {
            name::update_perspective_name(perspective_address, name)?;
        }

        Ok(())
    }

}
