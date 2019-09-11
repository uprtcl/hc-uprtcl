#![feature(proc_macro_hygiene)]
#[macro_use]
extern crate hdk;
extern crate hdk_proc_macros;
extern crate serde;
#[macro_use]
extern crate serde_derive;
#[macro_use]
extern crate serde_json;
extern crate holochain_json_derive;

use hdk::holochain_core_types::{
    dna::entry_types::Sharing,
    entry::{AppEntryValue, Entry},
};
use hdk::PUBLIC_TOKEN;
use hdk::{entry_definition::ValidatingEntryType, error::ZomeApiResult, DNA_ADDRESS};
use holochain_wasm_utils::api_serialization::get_entry::GetEntryResult;
use std::convert::TryInto;

use hdk::holochain_json_api::json::JsonString;

use hdk::holochain_persistence_api::cas::content::Address;

use hdk_proc_macros::zome;


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

    #[entry_def]
    fn source_def() -> ValidatingEntryType {
        entry!(
              name: "source",
              description: "represents an external source from which to retrieve entries from known addresses",
              sharing: Sharing::Public,
              validation_package: || {
                  hdk::ValidationPackageDefinition::Entry
              },
              validation: | _validation_data: hdk::EntryValidationData<String>| {
                  Ok(())
              },
              links: [
          from!(
            "proxy",
            link_type: "known_source",
            validation_package: || {
              hdk::ValidationPackageDefinition::Entry
            },
            validation: | _validation_data: hdk::LinkValidationData | {
              Ok(())
            }
          )
        ]
          )
    }
    #[zome_fn("hc_public")]
    fn get_own_source() -> ZomeApiResult<String> {
        Ok(own_source())
    }

    /**
     * Returns the known sources for the given address, as following:
     * - If we have the entry in our app, return our own source
     * - If we have stored the proxy and know the source, return that source,
     * - Otherwise, return empty vector
     */
    #[zome_fn("hc_public")]
    fn get_known_sources(address: Address) -> ZomeApiResult<Vec<String>> {
        match proxied_entry_exists(&address)? {
            true => Ok(vec![own_source()]),
            false => {
                let response = hdk::call(
                    hdk::THIS_INSTANCE,
                    "proxy",
                    Address::from(PUBLIC_TOKEN.to_string()),
                    "get_links_from_proxy",
                    json!({"proxy_address": address, "link_type": {
                        "LinkMatch": {
                            "Exactly": "known_source"
                        }
                    }, "tag": {
                        "LinkMatch": {
                            "Any": ""
                        }
                    }})
                        .into(),
                )?;

                let links_result: ZomeApiResult<Vec<Address>> = response.try_into()?;
                let links_addresses = links_result?;

                let mut sources: Vec<String> = Vec::new();
                for source_address in links_addresses.into_iter() {
                    let source: String = hdk::utils::get_as_type(source_address)?;
                    sources.push(source);
                }

                Ok(sources)
            }
        }
    }

    /**
     * Add the given source to the list of known source for the given address
     */
    #[zome_fn("hc_public")]
    fn add_known_sources(address: Address, sources: Vec<String>) -> ZomeApiResult<()> {
        set_entry_proxy(address.clone(), None)?;

        for source in sources.into_iter() {
            // If the source given is this app, do not add it to the known sources as this can be computed
            if source != own_source() {
                let source_address = create_source(source)?;

                let response = hdk::call(
          hdk::THIS_INSTANCE,
          "proxy",
          Address::from(PUBLIC_TOKEN.to_string()),
          "link_from_proxy",
          json!({"proxy_address": address.clone(), "to_address": source_address.clone(), "link_type": {
                        "LinkMatch": {
                            "Exactly": "known_source"
                        }
                    }, "tag": {
                        "LinkMatch": {
                            "Any": ""
                        }
                    }}).into(),
        )?;

                // Check that response from proxy zome is ok
                let _result: ZomeApiResult<Address> = response.try_into()?;
                let _address = _result?;
            }
        }
        Ok(())
    }

    #[zome_fn("hc_public")]
    fn remove_known_source(address: Address, source: String) -> ZomeApiResult<()> {
        let source_address = source_address(source)?;

        let response = hdk::call(
        hdk::THIS_INSTANCE,
        "proxy",
        Address::from(PUBLIC_TOKEN.to_string()),
        "remove_link_from_proxy",
        json!({"proxy_address": address.clone(), "to_address": source_address.clone(), "link_type": "known_source", "tag": ""}).into(),
      )?;

        // Check that response from proxy zome is ok
        response.try_into()?
    }

}

/** Helper functions */

fn own_source() -> String {
    String::from("holochain://") + &String::from(DNA_ADDRESS.to_owned())
}

fn source_entry(source: String) -> Entry {
    Entry::App("source".into(), AppEntryValue::from_json(source.as_str()))
}

fn source_address(source: String) -> ZomeApiResult<Address> {
    hdk::entry_address(&source_entry(source))
}

fn create_source(source: String) -> ZomeApiResult<Address> {
    hdk::commit_entry(&source_entry(source))
}

fn proxied_entry_exists(address: &Address) -> ZomeApiResult<bool> {
    let response = hdk::call(
        hdk::THIS_INSTANCE,
        "proxy",
        Address::from(PUBLIC_TOKEN.to_string()),
        "get_proxied_entry",
        json!({"address": address.clone()}).into(),
    )?;

    // Check that response from proxy zome is ok
    let result: ZomeApiResult<GetEntryResult> = response.try_into()?;
    let entry_result = result?;

    Ok(entry_result.found())
}

fn set_entry_proxy(proxy_address: Address, entry_address: Option<Address>) -> ZomeApiResult<()> {
    let response = hdk::call(
        hdk::THIS_INSTANCE,
        "proxy",
        Address::from(PUBLIC_TOKEN.to_string()),
        "set_entry_proxy",
        json!({"proxy_address": proxy_address, "entry_address": entry_address}).into(),
    )?;

    let _result: ZomeApiResult<Address> = response.try_into()?;
    let _address: Address = _result?;

    Ok(())
}
