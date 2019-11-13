use hdk::{
    AGENT_ADDRESS,
    entry_definition::ValidatingEntryType,
    error::ZomeApiResult,
    holochain_core_types::{
        dna::entry_types::Sharing, entry::Entry, validation::EntryValidationData,
    },
    holochain_json_api::{error::JsonError, json::JsonString},
    holochain_persistence_api::cas::content::Address,
};

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct UpdateRequest {
    from_perspective_address: Option<Address>,
    to_perspective_address: Address,
    old_head_address: Address,
    new_head_address: Address
}

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Proposal {
    creator_address: Address,
    description: Option<Address>,
    requests: Vec<Address>
}

pub fn proposal_definition() -> ValidatingEntryType {
    entry!(
        name: "proposal",
        description: "a proposal to update some perspectives",
        sharing: Sharing::Public,
        validation_package: || {
            hdk::ValidationPackageDefinition::Entry
        },
        validation: |_validation_data: hdk::EntryValidationData<Proposal>| {
            Ok(())
        },
        links: [
            from!(
                "update_request",
                link_type: "update_request->proposal",
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

pub fn update_request_definition() -> ValidatingEntryType {
    entry!(
        name: "update_request",
        description: "a request to update a single perspective to a new head",
        sharing: Sharing::Public,
        validation_package: || {
            hdk::ValidationPackageDefinition::Entry
        },
        validation: |validation_data: hdk::EntryValidationData<UpdateRequest>| {
            match validation_data {
                EntryValidationData::Create { .. } => {
                    Ok(())
                },
                _ => Err("Cannot modify or delete update requests".into())
            }
        },
        links: [
            from!(
                "perspective",
                link_type: "perspective->update_request",
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

/** Public handlers **/

pub fn create_update_request(update_request: UpdateRequest) -> ZomeApiResult<Address> {
    hdk::commit_entry(&Entry::App("update_request".into(), update_request.into()))
}

pub fn create_proposal(update_requests: Vec<UpdateRequest>, description: Option<Address>) -> ZomeApiResult<Address> {
    proposal_entry(update_requests, description, |proposal_entry| hdk::commit_entry(&proposal_entry))
}

pub fn update_proposal(proposal_address: Address, update_requests: Vec<UpdateRequest>, description: Option<Address>) -> ZomeApiResult<Address> {
    proposal_entry(update_requests, description, |proposal_entry| hdk::update_entry(proposal_entry, &proposal_address))
}

/** Private helpers **/

fn proposal_entry<F>(update_requests: Vec<UpdateRequest>, description: Option<Address>, proposal_creator: F) -> ZomeApiResult<Address> where F: Fn(Entry) -> ZomeApiResult<Address>{
    let update_results: ZomeApiResult<Vec<Address>> = update_requests.into_iter().map(|request| create_update_request(request)).collect();
    let update_requests_ids = update_results?;

    let proposal = Proposal {
        creator_address: AGENT_ADDRESS.clone(),
        description: description,
        requests: update_requests_ids.clone()
    };

    let entry_proposal = Entry::App("proposal".into(), proposal.into());

    let proposal_address = proposal_creator(entry_proposal)?;

    for request_id in update_requests_ids {
        hdk::link_entries(&request_id, &proposal_address, "update_request->proposal", "")?;
    }

    Ok(proposal_address)
}