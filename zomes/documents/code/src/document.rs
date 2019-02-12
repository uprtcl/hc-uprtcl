use holochain_wasm_utils::api_serialization::get_links::GetLinksResult;
use hdk::{
  entry_definition::ValidatingEntryType,
  error::{ZomeApiError, ZomeApiResult},
  holochain_core_types::{
    cas::content::Address, dna::entry_types::Sharing, entry::Entry, error::HolochainError,
    json::JsonString,
  },
  AGENT_ADDRESS
};

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

    links: [
      from!(
        "%agent_id",
        tag: "my_documents",
        validation_package: || {
          hdk::ValidationPackageDefinition::ChainFull
        },
        validation: |_source: Address, _target: Address, _validation_data: hdk::ValidationData | {
          Ok(())
        }
      )
    ]
  )
}

pub fn handle_create_document(title: String, content: String) -> ZomeApiResult<Address> {
  let document_entry = Entry::App("document".into(), Document::new(title.clone(), content).into());
  let document_address = hdk::commit_entry(&document_entry)?;

  #[derive(Serialize, Deserialize, Debug, DefaultJson)]
  struct CreateContextAndCommitInput {
    context_name: String,
    commit_message: String,
    content_address: Address 
  }
  let input = CreateContextAndCommitInput {
    context_name: title,
    commit_message: String::from("first commit"),
    content_address: document_address.clone()
  };

  let context_address = 
    hdk::call(hdk::THIS_INSTANCE, "vc", "test_token", "create_context_and_commit", input.into())?;

  hdk::debug(format!("HOLA {}", context_address));
  
  //hdk::link_entries(&AGENT_ADDRESS, &context_address, "my_documents")?;

  Ok(document_address)
}

pub fn handle_get_document(address: Address) -> ZomeApiResult<Option<Entry>> {
  hdk::get_entry(&address)
}

pub fn handle_get_my_documents() -> ZomeApiResult<GetLinksResult> {
  hdk::get_links(&AGENT_ADDRESS, "my_documents")
}