use crate::proxy;
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
        },
        links: [
            from!(
                holochain_anchors::ANCHOR_TYPE,
                link_type: "proxy->data",
                validation_package: || {
                    hdk::ValidationPackageDefinition::Entry
                },
                validation: |_validation_data: hdk::LinkValidationData | {
                    Ok(())
                }
            )
        ]
    )
}

pub fn create_data(data: JsonString, proxy_address: Option<Address>) -> ZomeApiResult<Address> {
    let entry = Entry::App("data".into(), data);

    hdk::commit_entry(&entry)?;

    proxy::set_entry_proxy(&entry, &proxy_address)
}
