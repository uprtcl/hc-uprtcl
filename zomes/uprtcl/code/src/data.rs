use hdk::prelude::*;

pub fn definition() -> ValidatingEntryType {
  entry!(
      name: "data",
      description: "a data entry",
      sharing: Sharing::Public,
      validation_package: || {
          hdk::ValidationPackageDefinition::Entry
      },
      validation: |_validation_data: hdk::EntryValidationData<JsonString>| {
        Ok(())
      }
  )
}

pub fn create_data(data: JsonString) -> ZomeApiResult<Address> {
  hdk::commit_entry(&Entry::App("data".into(), data))
}

