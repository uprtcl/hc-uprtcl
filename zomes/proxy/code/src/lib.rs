#![feature(proc_macro_hygiene)]
#[macro_use]
extern crate hdk;
extern crate hdk_proc_macros;
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate holochain_json_derive;
extern crate serde_json;

use hdk::DNA_ADDRESS;
use hdk::holochain_core_types::{
    dna::entry_types::Sharing, entry::Entry, link::LinkMatch as HdkLinkMatch,
};
use hdk::{entry_definition::ValidatingEntryType, error::ZomeApiResult};
use holochain_wasm_utils::api_serialization::{
    get_entry::{GetEntryOptions, GetEntryResult, StatusRequestKind},
    get_links::GetLinksResult,
};

use hdk::holochain_json_api::json::JsonString;

use hdk::holochain_persistence_api::cas::content::Address;

use hdk_proc_macros::zome;

// see https://developer.holochain.org/api/latest/hdk/ for info on using the hdk library
#[derive(Serialize, Deserialize, Copy, Clone, Debug, PartialEq)]
pub enum LinkMatch<S: Into<String>> {
    Any,
    Exactly(S),
    Regex(S),
}

#[zome]
mod my_zome {

    #[init]
    fn init() {
        Ok(())
    }

    #[validate_agent]
    pub fn validate_agent(validation_data: EntryValidationData<AgentId>) {
        Ok(())
    }

    #[zome_fn("hc_public")]
    fn get_source_name() -> ZomeApiResult<String> {
        Ok(String::from("holo:uprtcl:") + &String::from(DNA_ADDRESS.to_owned()))
    }
    
    #[entry_def]
    fn proxy_def() -> ValidatingEntryType {
        entry!(
            name: "proxy",
            description: "proxy to substitute any entry that wouldn't be present in the hApp",
            sharing: Sharing::Public,
            validation_package: || {
                hdk::ValidationPackageDefinition::Entry
            },
            validation: | _validation_data: hdk::EntryValidationData<Address>| {
                Ok(())
            },  
            links: [
                to!(
                    "proxy",
                    link_type: "external_proxy",
                    validation_package: || {
                        hdk::ValidationPackageDefinition::Entry
                    },
                    validation: |_validation_data: hdk::LinkValidationData | {
                        Ok(())
                    }
                ),
                to!(
                    "proxy",
                    link_type: "internal_proxy",
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

    /**
     * Sets the given proxy pointing to the given address
     */
    #[zome_fn("hc_public")]
    pub fn set_entry_proxy(
        proxy_address: Option<Address>,
        entry_address: Option<Address>,
    ) -> ZomeApiResult<Option<Address>> {
        // Store the given proxy as an entry
        let maybe_proxy_entry_address = match proxy_address {
            None => None,
            Some(address) => Some(hdk::commit_entry(&proxy_entry(address.clone()))?)
        };

        let maybe_internal_proxy_entry_address = match entry_address {
            None => None,
            Some(address) => Some(hdk::commit_entry(&proxy_entry(address.clone()))?)
        };

        if let (Some(proxy_entry_address), Some(internal_proxy_entry_address)) = (maybe_proxy_entry_address.clone(), maybe_internal_proxy_entry_address) {
            if proxy_entry_address != internal_proxy_entry_address {
                // We are setting an external proxy: set the internal and setup the links
                hdk::link_entries(
                    &proxy_entry_address,
                    &internal_proxy_entry_address,
                    "internal_proxy",
                    "",
                )?;
                hdk::link_entries(
                    &internal_proxy_entry_address,
                    &proxy_entry_address,
                    "external_proxy",
                    "",
                )?;
            }
        }

        Ok(maybe_proxy_entry_address)
    }

    /**
     * Returns the entry identified by the given address if it exists in the hApp
     */
    #[zome_fn("hc_public")]
    pub fn get_proxied_entry(address: Address) -> ZomeApiResult<GetEntryResult> {
        match handle_get_internal_address(address)? {
            Some(internal_address) => get_entry_result(&internal_address),
            None => entry_not_found(),
        }
    }

    #[zome_fn("hc_public")]
    pub fn get_internal_address(proxy_address: Address) -> ZomeApiResult<Option<Address>> {
        handle_get_internal_address(proxy_address)
    }

    /** Create link */

    /**
     * Links the given base entry to the proxy identified by the proxy_address
     */
    #[zome_fn("hc_public")]
    pub fn link_to_proxy(
        base_address: Address,
        proxy_address: Address,
        link_type: String,
        tag: String,
    ) -> ZomeApiResult<Address> {
        let proxy_entry_address = proxy_entry_address(proxy_address)?;
        hdk::link_entries(&base_address, &proxy_entry_address, link_type, tag)
    }

    /**
     * Links the proxy identified by the proxy_address to the given base entry
     */
    #[zome_fn("hc_public")]
    pub fn link_from_proxy(
        proxy_address: Address,
        to_address: Address,
        link_type: String,
        tag: String,
    ) -> ZomeApiResult<Address> {
        let proxy_entry_address = proxy_entry_address(proxy_address)?;
        hdk::link_entries(&proxy_entry_address, &to_address, link_type, tag)
    }

    /** Remove link */

    #[zome_fn("hc_public")]
    pub fn remove_link_to_proxy(
        base_address: Address,
        proxy_address: Address,
        link_type: String,
        tag: String,
    ) -> ZomeApiResult<()> {
        let proxy_entry_address = proxy_entry_address(proxy_address)?;
        hdk::remove_link(&base_address, &proxy_entry_address, link_type, tag)
    }

    /**
     * Links the proxy identified by the proxy_address to the given base entry
     */
    #[zome_fn("hc_public")]
    pub fn remove_link_from_proxy(
        proxy_address: Address,
        to_address: Address,
        link_type: String,
        tag: String,
    ) -> ZomeApiResult<()> {
        let proxy_entry_address = proxy_entry_address(proxy_address)?;
        hdk::remove_link(&proxy_entry_address, &to_address, link_type, tag)
    }

    /** Get links */

    /**
     * Get all links from the given proxy address and the proxies that represent the same identity
     */
    #[zome_fn("hc_public")]
    pub fn get_links_from_proxy(
        proxy_address: Address,
        link_type: LinkMatch<String>,
        tag: LinkMatch<String>,
    ) -> ZomeApiResult<Vec<Address>> {
        let proxy_entry_address = proxy_entry_address(proxy_address.clone())?;

        let internal_proxy_links = hdk::get_links(
            &proxy_entry_address,
            HdkLinkMatch::Exactly("internal_proxy"),
            HdkLinkMatch::Any,
        )?;

        match internal_proxy_links.addresses().len() {
            1 => get_links_from_internal_proxy(
                internal_proxy_links.addresses()[0].clone(),
                link_type,
                tag,
            ),
            _ => get_links_from_internal_proxy(proxy_entry_address, link_type, tag),
        }
    }

    /**
     * Returns all the links from the given base address to proxies addresses
     */
    #[zome_fn("hc_public")]
    pub fn get_links_to_proxy(
        base_address: Address,
        link_type: LinkMatch<String>,
        tag: LinkMatch<String>,
    ) -> ZomeApiResult<Vec<Address>> {
        let proxy_entries_addresses = get_links(&base_address, link_type, tag)?;

        let mut proxy_addresses: Vec<Address> = Vec::new();

        for proxy_entry_address in proxy_entries_addresses.addresses().into_iter() {
            let proxy_address: Address = hdk::utils::get_as_type(proxy_entry_address)?;
            proxy_addresses.push(proxy_address);
        }

        Ok(proxy_addresses)
    }

}

/** Helpers */

/**
 * Converts the given proxy address to the internal address of the entry in our app
 */
fn handle_get_internal_address(proxy_address: Address) -> ZomeApiResult<Option<Address>> {
    let maybe_entry = get_entry_result(&proxy_address)?;

    if maybe_entry.found() {
        return Ok(Some(proxy_address));
    }

    let proxy_entry_address = proxy_entry_address(proxy_address)?;

    match hdk::get_entry(&proxy_entry_address)? {
        None => Ok(None),
        Some(_) => {
            // We have stored the proxy for the given address
            let links = hdk::get_links(
                &proxy_entry_address,
                HdkLinkMatch::Exactly("internal_proxy"),
                HdkLinkMatch::Any,
            )?;
            match links.addresses().len() {
                1 => {
                    let internal_proxy: Address =
                        hdk::utils::get_as_type(links.addresses()[0].clone())?;
                    Ok(Some(internal_proxy))
                }
                _ => Ok(None),
            }
        }
    }
}

/**
 * Get all links from the given internal proxy address plus all the links from the external proxies associated with it
 */
fn get_links_from_internal_proxy(
    internal_proxy_entry_address: Address,
    link_type: LinkMatch<String>,
    tag: LinkMatch<String>,
) -> ZomeApiResult<Vec<Address>> {
    let internal_proxy_links = get_links(
        &internal_proxy_entry_address,
        link_type.clone(),
        tag.clone(),
    )?;

    let mut links: Vec<Address> = internal_proxy_links.addresses();

    let external_proxies_addresses = hdk::get_links(
        &internal_proxy_entry_address,
        HdkLinkMatch::Exactly("external_proxy"),
        HdkLinkMatch::Any,
    )?;

    for external_proxy_address in external_proxies_addresses.addresses() {
        let external_proxy_links =
            get_links(&external_proxy_address, link_type.clone(), tag.clone())?;
        links.append(&mut external_proxy_links.addresses());
    }

    Ok(links)
}

fn get_entry_result(address: &Address) -> ZomeApiResult<GetEntryResult> {
    hdk::get_entry_result(
        address,
        GetEntryOptions {
            status_request: StatusRequestKind::default(),
            entry: true,
            headers: true,
            timeout: Default::default(),
        },
    )
}

fn entry_not_found() -> ZomeApiResult<GetEntryResult> {
    Ok(GetEntryResult::new(StatusRequestKind::default(), None))
}

fn proxy_entry(proxy_address: Address) -> Entry {
    Entry::App("proxy".into(), proxy_address.into())
}

fn proxy_entry_address(proxy_address: Address) -> ZomeApiResult<Address> {
    hdk::entry_address(&proxy_entry(proxy_address))
}

fn get_links(
    base_address: &Address,
    link_type: LinkMatch<String>,
    tag: LinkMatch<String>,
) -> ZomeApiResult<GetLinksResult> {
    let mut _string1 = String::new();
    let mut _string2 = String::new();
    let mut _string3 = String::new();
    let mut _string4 = String::new();
    let new_link_type = match link_type {
        LinkMatch::Exactly(expr) => {
            _string1 = expr.to_owned();
            HdkLinkMatch::Exactly(_string1.as_str())
        }
        LinkMatch::Regex(expr) => {
            _string2 = expr.to_owned();

            HdkLinkMatch::Regex(_string2.as_str())
        }
        LinkMatch::Any => HdkLinkMatch::Any,
    };
    let new_link_tag = match tag {
        LinkMatch::Exactly(expr) => {
            _string3 = expr.to_owned();
            HdkLinkMatch::Exactly(_string1.as_str())
        }
        LinkMatch::Regex(expr) => {
            _string4 = expr.to_owned();

            HdkLinkMatch::Regex(_string2.as_str())
        }
        LinkMatch::Any => HdkLinkMatch::Any,
    };

    hdk::get_links(base_address, new_link_type, new_link_tag)
}
