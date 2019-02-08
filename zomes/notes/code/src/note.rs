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
    },

    links: [
      from!(
        "%agent_id",
        tag: "authored_notes",
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

pub fn handle_create_note(title: String, content: String) -> ZomeApiResult<Address> {
  let note_entry = Entry::App("note".into(), Note::new(title, content).into());
  let note_address = hdk::commit_entry(&note_entry)?;

  hdk::link_entries(&AGENT_ADDRESS, &note_address, "authored_notes")?;

  Ok(note_address)
}

pub fn handle_get_note(address: Address) -> ZomeApiResult<Option<Entry>> {
  hdk::get_entry(&address)
}

pub fn handle_get_my_notes() -> ZomeApiResult<Vec<ZomeApiResult<Entry>>> {
  hdk::get_links_and_load(&AGENT_ADDRESS, "authored_notes")
}