use boolinator::Boolinator;
use hdk::{
  entry_definition::ValidatingEntryType,
  error::ZomeApiResult,
  holochain_core_types::{
    cas::content::Address, dna::entry_types::Sharing, entry::Entry, error::HolochainError,
    json::JsonString,
  },
};

#[derive(Serialize, Deserialize, Debug, DefaultJson)]
pub enum BlobType {
  HolochainEntry {
    dna_address: Address,
    entry_address: Address,
  },
}

#[derive(Serialize, Deserialize, Debug, DefaultJson)]
pub struct Blob {
  content: BlobType,
}

impl Blob {
  fn new(content: BlobType) -> Blob {
    Blob { content: content }
  }

  fn from(dna_address: Address, entry_address: Address) -> Blob {
    Blob::new(BlobType::HolochainEntry {
      dna_address: dna_address.to_owned(),
      entry_address: entry_address.to_owned(),
    })
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
  crate::utils::store_entry_if_new(blob_entry)
}
