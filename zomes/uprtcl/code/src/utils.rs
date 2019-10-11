use hdk::DNA_ADDRESS;
use crate::proof::Secured;
use hdk::{
    error::{ZomeApiError, ZomeApiResult},
    holochain_core_types::link::LinkMatch,
    holochain_persistence_api::cas::content::Address,
    PUBLIC_TOKEN,
};
use holochain_wasm_utils::api_serialization::get_links::GetLinksResult;
use std::convert::{From,TryInto};

/** Proxy handlers */

pub fn set_entry_proxy(
    proxy_address: Option<Address>,
    entry_address: Option<Address>,
) -> ZomeApiResult<()> {
    let response = hdk::call(
        hdk::THIS_INSTANCE,
        "proxy",
        Address::from(PUBLIC_TOKEN.to_string()),
        "set_entry_proxy",
        json!({"proxy_address": proxy_address, "entry_address": entry_address}).into(),
    )?;
    let _result: ZomeApiResult<Option<Address>> = response.try_into()?;
    _result?;
    Ok(())
}

pub fn clone_entry<S, T>(previous_address: Option<Address>, entry: T) -> ZomeApiResult<Address>
where
    T: Secured<S>,
{
    let entry_address = hdk::commit_entry(&entry.entry())?;

    set_entry_proxy(previous_address, Some(entry_address.clone()))?;

    Ok(entry_address)
}

pub fn create_entry<S, T>(secured: T) -> ZomeApiResult<Address>
where
    T: Secured<S>,
{
    let entry_address = hdk::commit_entry(&secured.entry())?;

    set_entry_proxy(None, Some(entry_address.clone()))?;

    Ok(entry_address)
}

pub fn get_origin() -> String {
    String::from("hc:uprtcl:") + &String::from(DNA_ADDRESS.to_owned())
}

pub fn get_internal_address(address: Address) -> ZomeApiResult<Address> {
    let response = hdk::call(
        hdk::THIS_INSTANCE,
        "proxy",
        Address::from(PUBLIC_TOKEN.to_string()),
        "get_internal_address",
        json!({ "proxy_address": address }).into(),
    )?;
    let result: ZomeApiResult<Option<Address>> = response.try_into()?;
    match result? {
        Some(internal_address) => Ok(internal_address),
        None => Err(ZomeApiError::from(format!(
            "entry with hash {} does not exist",
            address
        ))),
    }
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
