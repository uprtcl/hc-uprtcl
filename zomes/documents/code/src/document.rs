use hdk::{
  entry_definition::ValidatingEntryType,
  error::{ZomeApiError, ZomeApiResult},
  holochain_core_types::{
    cas::content::Address, dna::entry_types::Sharing, entry::Entry, error::HolochainError,
    json::JsonString,
  },
  AGENT_ADDRESS, PUBLIC_TOKEN
};
use holochain_wasm_utils::api_serialization::get_links::GetLinksResult;
use serde_json::json;
use std::convert::TryFrom;
use holochain_wasm_utils::api_serialization::get_entry::{GetEntryResult,GetEntryOptions};

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Document {
  title: String,
  content: String,
}

impl Document {
  pub fn new(title: String, content: String) -> Document {
    Document {
      title: title,
      content: content,
    }
  }
}

pub fn definition() -> ValidatingEntryType {
  entry!(
    name: "document",
    description: "simple document",
    sharing: Sharing::Public,

    validation_package: || {
      hdk::ValidationPackageDefinition::Entry
    },

    validation: |_validation_data: hdk::EntryValidationData<Document>| {
      Ok(())
    },

    links: []
  )
}

pub fn handle_get_document(address: Address) -> ZomeApiResult<GetEntryResult> {
  hdk::get_entry_result(&address, GetEntryOptions::default())
}

pub fn handle_save_document(title: String, content: String) -> ZomeApiResult<Address> {
  let document_entry = Entry::App(
    "document".into(),
    Document::new(title, content).into(),
  );
  hdk::commit_entry(&document_entry)
}
