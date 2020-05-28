use crate::{proof::Secured, proxy};
use hdk::DNA_ADDRESS;
use hdk::{
    error::ZomeApiResult, holochain_core_types::link::LinkMatch,
    holochain_persistence_api::cas::content::Address,
};
use holochain_wasm_utils::api_serialization::get_links::GetLinksResult;
use std::convert::From;

/** Proxy handlers */

pub fn clone_entry<S, T>(previous_address: Option<Address>, entry: T) -> ZomeApiResult<Address>
where
    T: Secured<S>,
{
    let entry = entry.entry();
    let entry_address = hdk::commit_entry(&entry)?;

    proxy::set_entry_proxy(&entry, &previous_address)?;

    Ok(entry_address)
}

pub fn create_entry<S, T>(secured: T) -> ZomeApiResult<Address>
where
    T: Secured<S>,
{
    let entry_address = hdk::commit_entry(&secured.entry())?;

    Ok(entry_address)
}

pub fn get_cas_id() -> String {
    String::from("holochain://") + &String::from(DNA_ADDRESS.to_owned())
}

pub fn remove_previous_links(
    base_address: &Address,
    link_option: Option<String>,
    tag_option: Option<String>,
) -> ZomeApiResult<()> {
    let previous_links = get_links(base_address, link_option.clone(), tag_option.clone())?;
    for previous_link in previous_links.addresses() {
        hdk::remove_link(
            base_address,
            &previous_link,
            option_to_string(link_option.clone()),
            option_to_string(tag_option.clone()),
        )?;
    }
    Ok(())
}

/**
 * Returns the links associated with the given parameters
 */
pub fn get_links(
    base_address: &Address,
    link_option: Option<String>,
    tag_option: Option<String>,
) -> ZomeApiResult<GetLinksResult> {
    // Create long lived strings to hold the value of LinkMatch
    let mut _string1 = String::new();
    let mut _string2 = String::new();
    let link_type = match link_option {
        None => LinkMatch::Any,
        Some(link_string) => {
            _string1 = link_string.to_string();
            LinkMatch::Exactly(_string1.as_str())
        }
    };
    let tag = match tag_option {
        None => LinkMatch::Any,
        Some(tag_string) => {
            _string2 = tag_string.to_string();
            LinkMatch::Exactly(_string2.as_str())
        }
    };

    hdk::get_links(base_address, link_type, tag)
}

fn option_to_string(link_option: Option<String>) -> String {
    match link_option {
        Some(link) => link,
        None => String::from(""),
    }
}
