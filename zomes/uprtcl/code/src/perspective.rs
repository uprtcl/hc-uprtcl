use crate::proof::{Proof, Secured};
use crate::utils;
use hdk::{AGENT_ADDRESS,PUBLIC_TOKEN};
use hdk::{
    entry_definition::ValidatingEntryType,
    error::ZomeApiResult,
    holochain_core_types::{dna::entry_types::Sharing, entry::Entry},
    holochain_json_api::{error::JsonError, json::JsonString},
    holochain_persistence_api::cas::content::Address,
};
use std::convert::TryInto;

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct PerspectiveData {
    pub origin: String,
    pub creatorId: Address,
    pub timestamp: u128,
    pub name: String,
}


#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Perspective {
    payload: PerspectiveData,
    proof: Proof,
}

impl Perspective {
    pub fn new(name: String, timestamp: u128) -> ZomeApiResult<Perspective> {
        let origin = utils::get_origin();

        let perspective_data = PerspectiveData {
            name,
            timestamp,
            origin,
            creatorId: AGENT_ADDRESS.clone()
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
                hdk::EntryValidationData::Create { entry: perspective, .. } => {
                    Proof::verify(perspective)
                },
                _ => Err("Cannot modify or delete perspectives".into())
            }
        },
        links: [
            to!(
                "proxy",
                link_type: "head",
                validation_package: || {
                    hdk::ValidationPackageDefinition::Entry
                },
                validation: |_validation_data: hdk::LinkValidationData | {
                    Ok(())
                }
            ),
            to!(
                "proxy",
                link_type: "perspective->context",
                validation_package: || {
                    hdk::ValidationPackageDefinition::Entry
                },
                validation: |_validation_data: hdk::LinkValidationData | {
                    Ok(())
                }
            ),
            from!(
                "proxy",
                link_type: "context->perspective",
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
pub fn create_perspective(name: String, timestamp: u128) -> ZomeApiResult<Address> {
    let perspective = Perspective::new(name, timestamp)?;

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

fn get_perspective_link_to_proxy(perspective_address: Address, link_type: String) -> ZomeApiResult<Option<Address>> {
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

/**
 * Updates the head commit associated with the given perspective
 */
pub fn update_perspective_head(perspective_address: Address, head_address: Address) -> ZomeApiResult<()> {
    // Perspective address can be a proxy address, get the internal address
    let internal_perspective_address = utils::get_internal_address(perspective_address)?;

    utils::remove_previous_links(
        &internal_perspective_address,
        Some(String::from("head")),
        None,
    )?;
    link_perspective_to_commit(internal_perspective_address.clone(), head_address)?;
    Ok(())
}

// Link helpers

/**
 * Link the perspective to the commit, setting it as its head
 */
pub fn link_perspective_to_commit(
    perspective_address: Address,
    commit_address: Address,
) -> ZomeApiResult<()> {
    // Head commit may not exist on this hApp, we have to set its proxy address and use that entry to link
    utils::set_entry_proxy(Some(commit_address.clone()), Some(commit_address.clone()))?;

    let response = hdk::call(
        hdk::THIS_INSTANCE,
        "proxy",
        Address::from(PUBLIC_TOKEN.to_string()),
        "link_to_proxy",
        json!({ "base_address": perspective_address, "proxy_address": commit_address, "link_type": "head", "tag": ""}).into(),
    )?;
    let _result: ZomeApiResult<Address> = response.try_into()?;
    let _address = _result?;
    Ok(())
}
