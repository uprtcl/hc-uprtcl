#![feature(proc_macro_hygiene)]
#[macro_use]
extern crate hdk;
extern crate hdk_proc_macros;
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate serde_json;
#[macro_use]
extern crate holochain_json_derive;

use std::collections::HashMap;

use hdk::{
    entry_definition::ValidatingEntryType,
    error::ZomeApiResult,
};
use hdk::holochain_core_types::{
    entry::Entry,
    dna::entry_types::Sharing,
};

use hdk::holochain_json_api::{
    json::JsonString,
    error::JsonError
};

use hdk::holochain_persistence_api::{
    cas::content::Address
};

use hdk_proc_macros::zome;

// see https://developer.holochain.org/api/latest/hdk/ for info on using the hdk library

#[derive(Serialize, Deserialize, Debug, DefaultJson,Clone)]
pub struct Folder {
    links: HashMap<String, Address>,
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

    #[entry_def]
     fn folder_def() -> ValidatingEntryType {
        entry!(
            name: "folder",
            description: "a generic folder containing named links",
            sharing: Sharing::Public,
            validation_package: || {
                hdk::ValidationPackageDefinition::Entry
            },
            validation: | _validation_data: hdk::EntryValidationData<Folder>| {
                Ok(())
            }
        )
    }

    #[zome_fn("hc_public")]
    fn create_folder(folder: Folder) -> ZomeApiResult<Address> {
        let entry = Entry::App("folder".into(), folder.into());
        let address = hdk::commit_entry(&entry)?;
        Ok(address)
    }
}
