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

use hdk::holochain_core_types::{dna::entry_types::Sharing, entry::Entry, link::LinkMatch};
use hdk::PUBLIC_TOKEN;
use hdk::{entry_definition::ValidatingEntryType, error::ZomeApiResult};

use hdk::holochain_json_api::{error::JsonError, json::JsonString};

use hdk::holochain_persistence_api::cas::content::Address;

use hdk_proc_macros::zome;

use std::convert::{From, TryInto};

#[zome]
mod tags_zome {

    #[init]
    fn init() {
        Ok(())
    }

    #[validate_agent]
    pub fn validate_agent(validation_data: EntryValidationData<AgentId>) {
        Ok(())
    }

    #[entry_def]
    fn tags_entry_def() -> ValidatingEntryType {
        entry!(
            name: "tag",
            description: "tag entry definition",
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
                    link_type: "proxy->tag",
                    validation_package: || {
                        hdk::ValidationPackageDefinition::Entry
                    },
                    validation: | _validation_data: hdk::LinkValidationData| {
                        Ok(())
                    }
                ),
                to!(
                    "proxy",
                    link_type: "tag->proxy",
                    validation_package: || {
                        hdk::ValidationPackageDefinition::Entry
                    },
                    validation: | _validation_data: hdk::LinkValidationData| {
                        Ok(())
                    }
                )
            ]
        )
    }

    #[zome_fn("hc_public")]
    fn tag_entry(tag: String, entry_address: Address) -> ZomeApiResult<()> {
        let tag_address = match hdk::get_entry(&get_tag_address(&tag)?)? {
            None => create_tag(&tag)?,
            Some(_) => get_tag_address(&tag)?,
        };

        hdk::link_entries(&tag_address, &entry_address, "tag->proxy", "")?;
        hdk::link_entries(&entry_address, &tag_address, "proxy->tag", "")?;
        Ok(())
    }

    #[zome_fn("hc_public")]
    fn get_tagged_entries(tag: String) -> ZomeApiResult<Vec<Address>> {
        hdk::get_links(&tag_address(tag)?, LinkMatch::Exactly("tag->proxy"), LinkMatch;;)
    }
}

fn create_tag(tag: &String) -> ZomeApiResult<Address> {
    let tag_address = hdk::commit_entry(&get_tag_entry(&tag))?;

    let response = hdk::call(
        hdk::THIS_INSTANCE,
        "search",
        Address::from(PUBLIC_TOKEN.to_string()),
        "index_entry",
        json!({"address": tag_address.clone(), "content": tag}).into(),
    )?;
    let _result: ZomeApiResult<Option<Address>> = response.try_into()?;
    _result?;

    Ok(tag_address)
}

fn get_tag_entry(tag: &String) -> Entry {
    Entry::App("tag".into(), JsonString::from_json(tag.as_str()))
}

fn get_tag_address(tag: &String) -> ZomeApiResult<Address> {
    hdk::entry_address(&get_tag_entry(tag))
}
