use boolinator::Boolinator;
use hdk::{
  entry_definition::ValidatingEntryType,
  error::ZomeApiResult,
  holochain_core_types::{
    cas::content::Address,
    dna::entry_types::Sharing,
    entry::Entry,
    error::HolochainError,
    json::JsonString,
  },
};

#[derive(Serialize, Deserialize, Debug, DefaultJson)]
pub struct Blob {
  dna_address: Address,
  entry_address: Address,
}

impl Blob {
  fn new(dna_address: Address, entry_address: Address) -> Blob {
    Blob {
      dna_address: dna_address,
      entry_address: entry_address,
    }
  }
}

pub fn definition() -> ValidatingEntryType {
  entry!(
      name: "blob",
      description: "a blob object",
      sharing: Sharing::Public,
      native_type: Blob,

      validation_package: || {
        hdk::ValidationPackageDefinition::ChainFull
      },

      validation: |blob: Blob, _ctx: hdk::ValidationData| {
        Ok(())
      },

      links: [
  /*
        TODO: Investigate how to link with the actual entry?
        to!(
          "%agent_id",
          tag: "commit_author",
          validation_package: || {
            hdk::ValidationPackageDefinition::ChainFull
          },
          validation: |_source: Address, _target: Address, _ctx: hdk::ValidationData | {
            Ok(())
          }
        ), */
      ]
    )
}

/**
 * Stores the given blob in the DHT or if it already exists, return its address
 */
pub fn store_blob(blob: Blob) -> ZomeApiResult<Address> {
  let blob_entry = Entry::App("blob".into(), blob.into());
  let blob_address = hdk::entry_address(&blob_entry)?;

  match hdk::get_entry(&blob_address)? {
    Some(blob) => Ok(blob_address),
    None => hdk::commit_entry(&blob_entry),
  }
}
