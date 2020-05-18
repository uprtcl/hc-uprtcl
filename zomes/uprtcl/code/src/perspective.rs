use crate::proof::{Proof, Secured};
use crate::utils;
use hdk::{
    entry_definition::ValidatingEntryType,
    error::ZomeApiResult,
    holochain_core_types::{dna::entry_types::Sharing, entry::Entry},
    holochain_json_api::{error::JsonError, json::JsonString},
    holochain_persistence_api::cas::content::Address,
};
use hdk::{AGENT_ADDRESS, PUBLIC_TOKEN};
use std::convert::TryInto;

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct PerspectiveData {
    pub origin: String,
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
        let origin = utils::get_cas_id();

        let perspective_data = PerspectiveData {
            timestamp,
            origin,
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

/**
 * Get the head associated with the given perspective, if it exists
 */
pub fn get_perspective_head(perspective_address: Address) -> ZomeApiResult<Option<Address>> {
    get_perspective_link_to_proxy(perspective_address, String::from("head"))
}

/**
 * Get the context associated with the given perspective, if it exists
 */
pub fn get_perspective_context(perspective_address: Address) -> ZomeApiResult<Option<Address>> {
    get_perspective_link_to_proxy(perspective_address, String::from("perspective->context"))
}

fn get_perspective_link_to_proxy(
    perspective_address: Address,
    link_type: String,
) -> ZomeApiResult<Option<Address>> {
    // Get the internal perspective address, in case the given address is a hash with a different form than the one stored in this hApp
    let internal_perspective_address = utils::get_internal_address(perspective_address)?;

    let response = hdk::call(
        hdk::THIS_INSTANCE,
        "proxy",
        Address::from(PUBLIC_TOKEN.to_string()),
        "get_links_to_proxy",
        json!({ "base_address": internal_perspective_address, "link_type": { "Exactly": link_type }, "tag": "Any"})
            .into(),
    )?;

    let links_result: ZomeApiResult<Vec<Address>> = response.try_into()?;
    let links = links_result?;
    if links.len() == 0 {
        return Ok(None);
    }
    Ok(Some(links[0].clone()))
}

// Setters

// Link helpers
