use crate::utils;
use hdk::{
    entry_definition::ValidatingEntryType,
    error::ZomeApiResult,
    holochain_core_types::{
        dna::entry_types::Sharing, entry::Entry, link::LinkMatch, validation::EntryValidationData,
    },
    holochain_json_api::json::JsonString,
    holochain_persistence_api::cas::content::Address,
};
use holochain_wasm_utils::api_serialization::{
    get_entry::{GetEntryOptions, GetEntryResult},
    get_links::GetLinksOptions,
};

pub fn definition() -> ValidatingEntryType {
    entry!(
        name: "context",
        description: "a context associated with different perspectives",
        sharing: Sharing::Public,
        validation_package: || {
            hdk::ValidationPackageDefinition::Entry
        },
        validation: |validation_data: hdk::EntryValidationData<String>| {
            match validation_data {
                EntryValidationData::Create { .. } => {
                    Ok(())
                },
                _ => Err("Cannot modify or delete contexts".into())
            }
        },
        links: [
            from!(
                "perspective",
                link_type: "perspective->context",
                validation_package: || {
                    hdk::ValidationPackageDefinition::Entry
                },
                validation: |_validation_data: hdk::LinkValidationData | {
                    Ok(())
                }
            ),
            to!(
                "perspective",
                link_type: "context->perspective",
                validation_package: || {
                    hdk::ValidationPackageDefinition::Entry
                },
                validation: |_validation_data: hdk::LinkValidationData | {
                    Ok(())
                }
            )
        ]
    )
}

// Public handlers

/**
 * Return all perspectives associated to the given context
 */
pub fn get_context_perspectives(
    context: String,
) -> ZomeApiResult<Vec<ZomeApiResult<GetEntryResult>>> {
    let context_address = context_address(context)?;

    hdk::get_links_result(
        &context_address,
        LinkMatch::Exactly("context->perspective"),
        LinkMatch::Any,
        GetLinksOptions::default(),
        GetEntryOptions::default(),
    )
}

/**
 * Get the context associated with the given perspective, if it exists
 */
pub fn get_perspective_context(perspective_address: Address) -> ZomeApiResult<Option<String>> {
    // Get the internal perspective address, in case the given address is a hash with a different form than the one stored in this hApp
    let internal_perspective_address = utils::get_internal_address(perspective_address)?;

    let links = hdk::get_links(
        &internal_perspective_address,
        LinkMatch::Exactly("perspective->Context"),
        LinkMatch::Any,
    )?;

    match links.addresses().first() {
        None => Ok(None),
        Some(context_address) => {
            let context: String = hdk::utils::get_as_type(context_address.to_owned())?;
            Ok(Some(context))
        }
    }
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

    let context_address = create_context(context)?;

    hdk::link_entries(
        &context_address,
        &internal_perspective_address,
        "context->perspective",
        "",
    )?;
    hdk::link_entries(
        &internal_perspective_address,
        &context_address,
        "perspective->context",
        "",
    )?;

    Ok(())
}

/**
 * Remove the bidirectional links between the perspective and the previously linked context
 */
fn remove_previous_context_links(perspective_address: &Address) -> ZomeApiResult<()> {
    let previous_contexts = hdk::get_links(
        perspective_address,
        LinkMatch::Exactly("perspective->context"),
        LinkMatch::Any,
    )?;

    for previous_context in previous_contexts.addresses() {
        hdk::remove_link(
            perspective_address,
            &previous_context,
            "perspective->context",
            "",
        )?;
        hdk::remove_link(
            &previous_context,
            perspective_address,
            "context->perspective",
            "",
        )?;
    }

    Ok(())
}

/** Helper functions */

fn context_entry(context: String) -> Entry {
    Entry::App("context".into(), JsonString::from_json(context.as_str()))
}

fn context_address(context: String) -> ZomeApiResult<Address> {
    hdk::entry_address(&context_entry(context))
}

/**
 * Create the context
 */
fn create_context(context: String) -> ZomeApiResult<Address> {
    hdk::commit_entry(&context_entry(context))
}