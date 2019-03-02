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

#[derive(Serialize, Deserialize, Debug, DefaultJson)]
struct AddressResponse {
  pub Ok: Address,
}

#[derive(Serialize, Deserialize, Debug, DefaultJson)]
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
    native_type: Document,
    validation_package: || {
      hdk::ValidationPackageDefinition::Entry
    },

    validation: |_document: Document, _validation_data: hdk::ValidationData| {
      Ok(())
    },

    links: []
  )
}

pub fn handle_create_document(title: String, content: String) -> ZomeApiResult<Address> {
  let document_entry = Entry::App(
    "document".into(),
    Document::new(title.clone(), content).into(),
  );
  let document_address = hdk::commit_entry(&document_entry)?;

  #[derive(Serialize, Deserialize, Debug, DefaultJson)]
  struct OkResponse {
    pub Ok: CreatedCommitResponse
  }
  #[derive(Serialize, Deserialize, Debug, DefaultJson)]
  struct CreatedCommitResponse {
    pub context_address: Address,
    pub branch_address: Address,
    pub commit_address: Address,
  }
  
  let response_json = hdk::call(
    hdk::THIS_INSTANCE,
    "vc",
    Address::from(PUBLIC_TOKEN.to_string()),
    "create_context_and_commit",
    json!({
      "name": title,
      "message": "first commit",
      "content": { "data": document_address, "links": []}
    })
    .into(),
  )?;

  let response = OkResponse::try_from(response_json)?;

  Ok(response.Ok.context_address)
}

pub fn handle_get_document(address: Address) -> ZomeApiResult<GetEntryResult> {
  hdk::get_entry_result(&address, GetEntryOptions::default())
}

pub fn handle_save_document(branch_address: Address, title: String, content: String) -> ZomeApiResult<Address> {
  let document_entry = Entry::App(
    "document".into(),
    Document::new(title.clone(), content).into(),
  );
  let document_address = hdk::commit_entry(&document_entry)?;

  let response_json = hdk::call(
    hdk::THIS_INSTANCE,
    "vc",
    Address::from(PUBLIC_TOKEN.to_string()),
    "create_commit",
    json!({
      "branch_address": branch_address,
      "message": "commit",
      "content": { "data": document_address, "links": []}
    })
    .into(),
  )?;

  let response = AddressResponse::try_from(response_json)?;

  Ok(response.Ok)
}
