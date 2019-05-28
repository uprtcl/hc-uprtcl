use hdk::holochain_core_types::{
  cas::content::Address, dna::entry_types::Sharing, entry::Entry, error::HolochainError,
  json::JsonString, validation::EntryValidationData,
};
use hdk::{entry_definition::ValidatingEntryType, error::ZomeApiResult};
use std::convert::TryFrom;

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Source {
  pub source: String,
}

impl Source {
  pub fn new(source: String) -> Source {
    Source {
      source: source.to_owned(),
    }
  }
}

pub fn definition() -> ValidatingEntryType {
  entry!(
      name: "source",
      description: "represents an external source from which to retrieve addresses",
      sharing: Sharing::Public,
      validation_package: || {
          hdk::ValidationPackageDefinition::Entry
      },

      validation: | _validation_data: hdk::EntryValidationData<Source>| {
          Ok(())
      },
      links: [
        from!(
          "addressable",
          link_type: "known_source",
          validation_package: || {
            hdk::ValidationPackageDefinition::ChainFull
          },
          validation: | _validation_data: hdk::LinkValidationData | {
            Ok(())
          }
        )
      ]
  )
}

/** Public handlers */

pub fn handle_get_known_sources(address: Address) -> ZomeApiResult<Vec<String>> {
  let links_result = hdk::get_links_and_load(&address, Some(String::from("known_source")), None)?;

  let mut sources: Vec<String> = Vec::new();
  for entry_result in links_result.into_iter() {
    if let Ok(Entry::App(_, entry)) = entry_result {
      let source = crate::sources::Source::try_from(entry)?;
      sources.push(source.source);
    }
  }

  Ok(sources)
}

pub fn handle_add_known_sources(address: Address, sources: Vec<String>) -> ZomeApiResult<()> {
  let addressable_address = crate::addressable::create_addressable(address)?;
  for source in sources.into_iter() {
    let source_address = create_source(source)?;
    hdk::link_entries(
      &addressable_address,
      &source_address,
      String::from("known_source"),
      String::from(""),
    )?;
  }
  Ok(())
}

pub fn handle_remove_known_sources(address: Address, source: String) -> ZomeApiResult<()> {
  let source_address = source_address(source)?;
  hdk::remove_link(&address, &source_address, "known_source", "")?;

  Ok(())
}

/** Helper functions */

fn source_entry(source: String) -> Entry {
  Entry::App("source".into(), Source::new(source).into())
}

fn source_address(source: String) -> ZomeApiResult<Address> {
  hdk::entry_address(&source_entry(source))
}

fn create_source(source: String) -> ZomeApiResult<Address> {
  hdk::commit_entry(&source_entry(source))
}
