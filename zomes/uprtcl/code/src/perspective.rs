use crate::proof::{Proof, Secured};
use crate::utils;
use hdk::{
    entry_definition::ValidatingEntryType,
    error::ZomeApiResult,
    holochain_core_types::{dna::entry_types::Sharing, entry::Entry},
    holochain_json_api::{error::JsonError, json::JsonString},
    holochain_persistence_api::cas::content::Address,
};
use hdk::{AGENT_ADDRESS};

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct PerspectiveData {
    pub authority: String,
    pub creatorId: Address,
    pub timestamp: u128,
}

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Perspective {
    payload: PerspectiveData,
    proof: Proof,
}

impl Perspective {
    pub fn new(timestamp: u128) -> ZomeApiResult<Perspective> {
        let authority = utils::get_cas_id();

        let perspective_data = PerspectiveData {
            timestamp,
            authority,
            creatorId: AGENT_ADDRESS.clone(),
        };

        Perspective::from_data(perspective_data)
    }
}

impl Secured<PerspectiveData> for Perspective {
    fn from_data(perspective_data: PerspectiveData) -> ZomeApiResult<Self> {
        let proof = Proof::from(perspective_data.clone().into())?;

        Ok(Perspective {
            payload: perspective_data,
            proof: proof,
        })
    }

    fn entry(&self) -> Entry {
        Entry::App("perspective".into(), self.into())
    }

    fn creator_id(&self) -> Address {
        self.payload.creatorId.to_owned()
    }

    fn payload(&self) -> JsonString {
        self.payload.to_owned().into()
    }

    fn proof(&self) -> Proof {
        self.proof.to_owned()
    }
}

pub fn definition() -> ValidatingEntryType {
    entry!(
        name: "perspective",
        description: "perspective pointing to a proxied commit",
        sharing: Sharing::Public,
        validation_package: || {
            hdk::ValidationPackageDefinition::Entry
        },
        validation: |validation_data: hdk::EntryValidationData<Perspective>| {
            match validation_data {
                hdk::EntryValidationData::Create { .. } => {
                    Ok(())
                },
                _ => Err("Cannot modify or delete perspectives".into())
            }
        },
        links: [
            to!(
                holochain_anchors::ANCHOR_TYPE,
                link_type: "head",
                validation_package: || {
                    hdk::ValidationPackageDefinition::Entry
                },
                validation: |_validation_data: hdk::LinkValidationData | {
                    Ok(())
                }
            ),
            to!(
                holochain_anchors::ANCHOR_TYPE,
                link_type: "context",
                validation_package: || {
                    hdk::ValidationPackageDefinition::Entry
                },
                validation: |_validation_data: hdk::LinkValidationData | {
                    Ok(())
                }
            ),
            to!(
                holochain_anchors::ANCHOR_TYPE,
                link_type: "name",
                validation_package: || {
                    hdk::ValidationPackageDefinition::Entry
                },
                validation: |_validation_data: hdk::LinkValidationData | {
                    Ok(())
                }
            ),
            from!(
                holochain_anchors::ANCHOR_TYPE,
                link_type: "context->perspective",
                validation_package: || {
                    hdk::ValidationPackageDefinition::Entry
                },
                validation: |_validation_data: hdk::LinkValidationData | {
                    Ok(())
                }
            ),
            from!(
                holochain_anchors::ANCHOR_TYPE,
                link_type: "proxy",
                validation_package: || {
                    hdk::ValidationPackageDefinition::Entry
                },
                validation: |_validation_data: hdk::LinkValidationData | {
                    Ok(())
                }
            ),
            from!(
                "%agent_id",
                link_type: "agent->perspective",
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

// Create

/**
 * Create the perspective with the given input data
 */
pub fn create_perspective(timestamp: u128) -> ZomeApiResult<Address> {
    let perspective = Perspective::new(timestamp)?;

    utils::create_entry(perspective)
}

// Getters
