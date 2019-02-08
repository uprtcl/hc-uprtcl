use hdk::{
  entry_definition::ValidatingEntryType,
  error::{ZomeApiError, ZomeApiResult},
  holochain_core_types::{
    cas::content::Address, dna::entry_types::Sharing, entry::Entry, error::HolochainError,
    json::JsonString,
  },
};

#[derive(Serialize, Deserialize, Debug, DefaultJson)]
pub struct Note {
  title: String,
  content: String,
}

impl Note {
  pub fn new(title: String, content: String) -> Note {
    Note {
      title: title,
      content: content,
    }
  }
}

pub fn definition() -> ValidatingEntryType {
  entry!(
    name: "note",
    description: "simple note",
    sharing: Sharing::Public,
    native_type: Note,
    validation_package: || {
      hdk::ValidationPackageDefinition::Entry
    },

    validation: |_note: Note, _validation_data: hdk::ValidationData| {
      Ok(())
    }
  )
}

pub fn handle_create_note(title: String, content: String) -> ZomeApiResult<Address> {
  let note_entry = Entry::App("note".into(), Note::new(title, content).into());
  hdk::commit_entry(&note_entry)
}

pub fn handle_get_note(address: Address) -> ZomeApiResult<Option<Entry>> {
  hdk::get_entry(&address)
}
