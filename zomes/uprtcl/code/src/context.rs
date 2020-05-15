use crate::proof::{Proof, Secured};
use crate::utils;
use hdk::{
    entry_definition::ValidatingEntryType,
    error::ZomeApiResult,
    holochain_core_types::{
        dna::entry_types::Sharing, entry::Entry, link::LinkMatch, validation::EntryValidationData,
    },
    holochain_json_api::{error::JsonError, json::JsonString},
    holochain_persistence_api::cas::content::Address,
    AGENT_ADDRESS, PUBLIC_TOKEN,
};
use holochain_wasm_utils::api_serialization::get_entry::{GetEntryOptions, GetEntryResult};
use std::convert::TryInto;

// Public handlers

/**
 * Create the context with the given input data
 */
pub fn context_address(context: String) -> ZomeApiResult<Address> {
    holochain_anchors::anchor("context".into(), context)
}

/**
 * Return all perspectives associated to the given context
 */
pub fn get_context_perspectives(
    context: String,
) -> ZomeApiResult<Vec<ZomeApiResult<GetEntryResult>>> {
    let address = context_address(context)?;

    hdk::get_links(address, , tag)

    let response = hdk::call(
        hdk::THIS_INSTANCE,
        "proxy",
        Address::from(PUBLIC_TOKEN.to_string()),
        "get_links_from_proxy",
        json!({ "proxy_address": context_address, "link_type": { "Exactly": "context->perspective" }, "tag": "Any" }).into(),
    )?;

    let perspectives_result: ZomeApiResult<Vec<Address>> = response.try_into()?;
    let perspectives_addresses = perspectives_result?;

    let mut perspectives: Vec<ZomeApiResult<GetEntryResult>> = Vec::new();

    for perspective_address in perspectives_addresses {
        perspectives.push(hdk::get_entry_result(
            &perspective_address,
            GetEntryOptions::default(),
        ));
    }
    Ok(perspectives)
}

/**
 * Update the context associated to the given perspective
 */
pub fn update_perspective_context(
    perspective_address: Address,
    context: String,
) -> ZomeApiResult<()> {
    // Get the internal perspective address, in case the given address is a hash with a different form than the one stored in this hApp
    let internal_perspective_address = utils::get_internal_address(perspective_address)?;

    // Remove the previous links, as only one link to a context is valid in any given time
    remove_previous_context_links(&internal_perspective_address)?;

    // Context may not exist on this hApp, we have to set its proxy address and use that entry to link
    utils::set_entry_proxy(Some(context_address.clone()), Some(context_address.clone()))?;

    let response = hdk::call(
        hdk::THIS_INSTANCE,
        "proxy",
        Address::from(PUBLIC_TOKEN.to_string()),
        "link_from_proxy",
        json!({"proxy_address": context_address, "to_address": internal_perspective_address, "link_type": "context->perspective", "tag": ""}).into(),
    )?;

    let _result: ZomeApiResult<Address> = response.try_into()?;
    let _address = _result?;

    let response2 = hdk::call(
        hdk::THIS_INSTANCE,
        "proxy",
        Address::from(PUBLIC_TOKEN.to_string()),
        "link_to_proxy",
        json!({"base_address": internal_perspective_address, "proxy_address": context_address, "link_type": "perspective->context", "tag": ""}).into(),
    )?;

    let _result2: ZomeApiResult<Address> = response2.try_into()?;
    let _address2 = _result2?;

    Ok(())
}
