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
pub fn definition() -> ValidatingEntryType {
    entry!(
        name: "name",
        description: "the name of the perspective",
        sharing: Sharing::Public,
        validation_package: || {
            hdk::ValidationPackageDefinition::Entry
        },
        validation: |validation_data: hdk::EntryValidationData<String>| {
            match validation_data {
                EntryValidationData::Create { .. } => {
                    Ok(())
                },
                _ => Err("Cannot modify or delete names".into())
            }
        },
        links: [
            from!(
                "perspective",
                link_type: "perspective->name",
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

/** Public handlers **/

pub fn update_perspective_name(perspective_address: Address, name: String) -> ZomeApiResult<()> {
    // Get the internal perspective address, in case the given address is a hash with a different form than the one stored in this hApp
    let internal_perspective_address = utils::get_internal_address(perspective_address)?;

    // Remove the previous name, as only one link to a name is valid in any given time
    remove_previous_name(&internal_perspective_address)?;

    let name_address = create_name(name)?;

    hdk::link_entries(
        &internal_perspective_address,
        &name_address,
        "perspective->name",
        "",
    )?;

    Ok(())
}

/**
 * Get the context associated with the given perspective, if it exists
 */
pub fn get_perspective_name(perspective_address: Address) -> ZomeApiResult<Option<String>> {
    // Get the internal perspective address, in case the given address is a hash with a different form than the one stored in this hApp
    let internal_perspective_address = utils::get_internal_address(perspective_address.clone())?;

    let links = hdk::get_links(
        &internal_perspective_address,
        LinkMatch::Exactly("perspective->name"),
        LinkMatch::Any,
    )?;

    match links.addresses().first() {
        None => Ok(None),
        Some(name_address) => {
            let name: String = hdk::utils::get_as_type(name_address.to_owned())?;
            Ok(Some(name))
        }
    }
}

/** Private helpers **/

/**
 * Remove the links between the perspective and the previously linked name
 */
fn remove_previous_name(perspective_address: &Address) -> ZomeApiResult<()> {
    let previous_names = hdk::get_links(
        perspective_address,
        LinkMatch::Exactly("perspective->name"),
        LinkMatch::Any,
    )?;

    for previous_name in previous_names.addresses() {
        hdk::remove_link(perspective_address, &previous_name, "perspective->name", "")?;
    }

    Ok(())
}

fn name_entry(name: String) -> Entry {
    Entry::App("name".into(), JsonString::from_json(name.as_str()))
}

/**
 * Create the name
 */
fn create_name(name: String) -> ZomeApiResult<Address> {
    hdk::commit_entry(&name_entry(name))
}
