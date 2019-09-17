use crate::proof::{Proof, Secured};
use crate::utils;
use hdk::{
    entry_definition::ValidatingEntryType,
    error::ZomeApiResult,
    holochain_core_types::{
        dna::entry_types::Sharing, entry::Entry, validation::EntryValidationData,
    },
    holochain_json_api::{error::JsonError, json::JsonString},
    holochain_persistence_api::cas::content::Address,
    PUBLIC_TOKEN,
};
use holochain_wasm_utils::api_serialization::get_entry::{GetEntryOptions, GetEntryResult};
use std::convert::TryInto;

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct ContextData {
    creatorId: Address,
    timestamp: u128,
    nonce: u128,
}

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Context {
    payload: ContextData,
    proof: Proof,
}

impl Secured<ContextData> for Context {
    fn from_data(context_data: ContextData) -> ZomeApiResult<Self> {
        let proof = Proof::from(context_data.clone().into())?;

        Ok(Context {
            payload: context_data,
            proof: proof,
        })
    }

    fn entry(&self) -> Entry {
        Entry::App("context".into(), self.into())
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
        name: "context",
        description: "a context associated with different perspectives",
        sharing: Sharing::Public,
        validation_package: || {
            hdk::ValidationPackageDefinition::Entry
        },
        validation: |validation_data: hdk::EntryValidationData<Context>| {
            match validation_data {
                EntryValidationData::Create { entry: context, .. } => {
                    Proof::verify(context)
                },
                _ => Err("Cannot modify or delete contexts".into())
            }
        }
    )
}

// Public handlers

/**
 * Create the context with the given input data
 */
pub fn create_context(context_data: ContextData) -> ZomeApiResult<Address> {
    let context = Context::from_data(context_data)?;

    utils::create_entry(context)
}

/** 
 * Return all perspectives associated to the given context
 */
pub fn get_context_perspectives(
    context_address: Address,
) -> ZomeApiResult<Vec<ZomeApiResult<GetEntryResult>>> {
    let response = hdk::call(
        hdk::THIS_INSTANCE,
        "proxy",
        Address::from(PUBLIC_TOKEN.to_string()),
        "get_links_from_proxy",
        json!({ "proxy_address": context_address, "link_type": "perspectives", "tag": "" }).into(),
    )?;
    
    let perspectives_result: ZomeApiResult<Vec<Address>> = response.try_into()?;
    let perspectives_addresses = perspectives_result?;
    
    let mut perspectives: Vec<ZomeApiResult<GetEntryResult>> = Vec::new();

    for perspective_address in perspectives_addresses {
        perspectives.push(hdk::get_entry_result(
            &perspective_address,
            GetEntryOptions::default(),
        ));
    }
    Ok(perspectives)
}

/**
 * Update the context associated to the given perspective
 */
pub fn update_perspective_context(
    perspective_address: Address,
    context_address: Address,
) -> ZomeApiResult<()> {
    // Context may not exist on this hApp, we have to set its proxy address and use that entry to link
    utils::set_entry_proxy(Some(context_address.clone()), Some(context_address.clone()))?;

    let response = hdk::call(
        hdk::THIS_INSTANCE,
        "proxy",
        Address::from(PUBLIC_TOKEN.to_string()),
        "link_from_proxy",
        json!({"proxy_address": context_address, "to_address": perspective_address, "link_type": "perspectives", "tag": ""}).into(),
    )?;

    let _result: ZomeApiResult<Address> = response.try_into()?;
    let _address = _result?;

    let response2 = hdk::call(
        hdk::THIS_INSTANCE,
        "proxy",
        Address::from(PUBLIC_TOKEN.to_string()),
        "link_to_proxy",
        json!({"base_address": perspective_address, "proxy_address": context_address, "link_type": "context", "tag": ""}).into(),
    )?;

    let _result2: ZomeApiResult<Address> = response2.try_into()?;
    let _address2 = _result2?;

    Ok(())
}
