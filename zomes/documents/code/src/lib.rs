#![feature(proc_macro_hygiene)]
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

use hdk::holochain_core_types::{dna::entry_types::Sharing, entry::Entry};
use hdk::{entry_definition::ValidatingEntryType, error::ZomeApiResult, DNA_ADDRESS, PUBLIC_TOKEN};

use hdk::holochain_json_api::{error::JsonError, json::JsonString};

use hdk::holochain_persistence_api::cas::content::Address;

use hdk_proc_macros::zome;
use std::convert::{From, TryInto};

// see https://developer.holochain.org/api/latest/hdk/ for info on using the hdk library

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub enum TextType {
    Paragraph,
    Title,
}

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct TextNode {
    text: String,
    r#type: TextType,
    links: Vec<Address>,
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
    fn text_node_def() -> ValidatingEntryType {
        entry!(
            name: "text_node",
            description: "a document represented as some text and the links to the children texts",
            sharing: Sharing::Public,
            validation_package: || {
                hdk::ValidationPackageDefinition::Entry
            },
            validation: | _validation_data: hdk::EntryValidationData<TextNode>| {
                Ok(())
            }
        )
    }

    #[zome_fn("hc_public")]
    fn create_text_node(
        previous_address: Option<Address>,
        node: TextNode,
    ) -> ZomeApiResult<Address> {
        let entry = Entry::App("text_node".into(), node.into());
        let address = hdk::commit_entry(&entry)?;

        if let Some(proxy_address) = previous_address {
            set_entry_proxy(Some(proxy_address.clone()), Some(address.clone()))?;
            return Ok(proxy_address);
        }

        Ok(address)
    }
}

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
