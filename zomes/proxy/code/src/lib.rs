#![feature(try_from)]
#[macro_use]
extern crate hdk;
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate serde_json;
#[macro_use]
extern crate holochain_core_types_derive;

use hdk::{
    entry_definition::ValidatingEntryType,
    error::ZomeApiResult,
    holochain_core_types::{
        cas::content::Address, dna::entry_types::Sharing, entry::Entry, error::HolochainError,
        json::JsonString, validation::EntryValidationData,
    },
};
use holochain_wasm_utils::api_serialization::get_entry::GetEntryResult;

pub mod proxy;
pub mod utils;

define_zome! {
    entries: [
       proxy::definition()
    ]

    genesis: || { Ok(()) }

    functions: [
        set_entry_proxy: {
            inputs: |proxy_address: Address, entry_address: Option<Address>|,
            outputs: |result: ZomeApiResult<Address>|,
            handler: proxy::handle_set_entry_proxy
        }
        get_proxied_entry: {
            inputs: |address: Address|,
            outputs: |result: ZomeApiResult<GetEntryResult>|,
            handler: proxy::handle_get_proxied_entry
        }
        link_to_proxy: {
            inputs: |base_address: Address, proxy_address: Address, link_type: String, tag: String|,
            outputs: |result: ZomeApiResult<Address>|,
            handler: proxy::handle_link_to_proxy
        }
        link_from_proxy: {
            inputs: |proxy_address: Address, to_address: Address, link_type: String, tag: String|,
            outputs: |result: ZomeApiResult<Address>|,
            handler: proxy::handle_link_from_proxy
        }
        get_links_from_proxy: {
            inputs: |proxy_address: Address, link_type: Option<String>, tag: Option<String>|,
            outputs: |result: ZomeApiResult<Vec<Address>>|,
            handler: proxy::handle_get_links_from_proxy
        }
        get_links_to_proxy: {
            inputs: |base_address: Address, link_type: Option<String>, tag: Option<String>|,
            outputs: |result: ZomeApiResult<Vec<Address>>|,
            handler: proxy::handle_get_links_to_proxy
        }
    ]

    traits: {
        hc_public [set_entry_proxy,get_proxied_entry,link_to_proxy]
    }
}
