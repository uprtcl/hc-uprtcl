#![feature(proc_macro_hygiene)]
#[macro_use]
extern crate hdk;
extern crate hdk_proc_macros;
extern crate serde;
#[macro_use]
extern crate serde_derive;
#[macro_use]
extern crate serde_json;

use hdk::holochain_core_types::link::LinkMatch;
use hdk::holochain_core_types::{dna::entry_types::Sharing, entry::Entry};
use hdk::{
    entry_definition::ValidatingEntryType,
    error::{ZomeApiError, ZomeApiResult},
    PUBLIC_TOKEN,
};

use hdk::holochain_json_api::json::JsonString;

use hdk::holochain_persistence_api::cas::content::Address;

use hdk_proc_macros::zome;
use std::convert::{From, TryInto};

// see https://developer.holochain.org/api/latest/hdk/ for info on using the hdk library

#[zome]
mod drafts_zome {

    #[init]
    fn init() {
        Ok(())
    }

    #[validate_agent]
    pub fn validate_agent(validation_data: EntryValidationData<AgentId>) {
        Ok(())
    }

    #[entry_def]
    fn draft_def() -> ValidatingEntryType {
        entry!(
            name: "draft",
            description: "Generic JsonString draft associated to any element with the given hash",
            sharing: Sharing::Public,
            validation_package: || {
                hdk::ValidationPackageDefinition::Entry
            },
            validation: | _validation_data: hdk::EntryValidationData<JsonString>| {
                Ok(())
            },
            links: [
                from!(
                    "proxy",
                    link_type: "proxy->draft",
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

    #[zome_fn("hc_public")]
    fn get_draft(address: Address) -> ZomeApiResult<Option<JsonString>> {
        let internal_address = get_proxy_address(address)?;

        let links: Vec<JsonString> = hdk::utils::get_links_and_load_type(
            &internal_address,
            LinkMatch::Exactly("proxy->draft"),
            LinkMatch::Any,
        )?;

        match links.get(0) {
            None => Ok(None),
            Some(draft) => Ok(Some(draft.to_owned())),
        }
    }

    #[zome_fn("hc_public")]
    fn update_draft(address: Address, draft: JsonString) -> ZomeApiResult<()> {
        set_entry_proxy(Some(address.clone()), None)?;

        let internal_address = get_proxy_address(address)?;

        remove_previous_drafts(internal_address.clone())?;

        let draft_entry = Entry::App("draft".into(), draft);
        let address = hdk::commit_entry(&draft_entry)?;

        hdk::link_entries(&internal_address, &address, "proxy->draft", "")?;

        Ok(())
    }
}

fn get_proxy_address(address: Address) -> ZomeApiResult<Address> {
    let internal_address = get_internal_address(address)?;
    proxy_entry_address(internal_address)
}

fn set_entry_proxy(
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

fn get_internal_address(address: Address) -> ZomeApiResult<Address> {
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

fn remove_previous_drafts(internal_address: Address) -> ZomeApiResult<()> {
    let links = hdk::get_links(
        &internal_address,
        LinkMatch::Exactly("proxy->draft"),
        LinkMatch::Any,
    )?;

    for link in links.addresses().into_iter() {
        hdk::remove_link(&internal_address.clone(), &link, "proxy->draft", "")?;
    }

    Ok(())
}

fn proxy_entry(proxy_address: Address) -> Entry {
    Entry::App("proxy".into(), proxy_address.into())
}

fn proxy_entry_address(proxy_address: Address) -> ZomeApiResult<Address> {
    hdk::entry_address(&proxy_entry(proxy_address))
}
