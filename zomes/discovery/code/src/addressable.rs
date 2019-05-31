use hdk::error::ZomeApiResult;
use hdk::entry_definition::ValidatingEntryType;
use hdk::holochain_core_types::{
  cas::content::Address, dna::entry_types::Sharing, entry::Entry, error::HolochainError,
  json::JsonString,
};

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Addressable {
  address: Address,
}

impl Addressable {
  pub fn new(address: Address) -> Addressable {
    Addressable {
      address: address.to_owned(),
    }
  }
}

pub fn definition() -> ValidatingEntryType {
  entry!(
      name: "addressable",
      description: "simple entry containing a single address",
      sharing: Sharing::Public,
      validation_package: || {
          hdk::ValidationPackageDefinition::Entry
      },

      validation: | _validation_data: hdk::EntryValidationData<Addressable>| {
          Ok(())
      }
  )
}

/** Helper functions */

pub fn addressable_entry(address: Address) -> Entry {
  Entry::App("addressable".into(), Addressable::new(address).into())
}

pub fn create_addressable(address: Address) -> ZomeApiResult<Address> {
  hdk::commit_entry(&addressable_entry(address))
}

pub fn addressable_address(address: Address) ->ZomeApiResult<Address> {
  let addressable_entry = addressable_entry(address);
  hdk::entry_address(&addressable_entry)
}