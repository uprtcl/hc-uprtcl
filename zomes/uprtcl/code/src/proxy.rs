use cid::{Cid, Codec, Version};
use hdk::prelude::*;
use holochain_anchors;
use multibase;
use multihash::Sha2_256;
use serde_cbor::to_vec;
use serde_json;

pub fn proxy_address(proxied_address: &Address) -> ZomeApiResult<Address> {
    holochain_anchors::anchor("proxy".into(), proxied_address.to_string())
}

pub fn set_entry_proxy(entry: &Entry, proxied_address: &Option<Address>) -> ZomeApiResult<Address> {
    let entry_address = entry.address();

    let final_proxy_address = match proxied_address {
        Some(a) => Ok(a.clone()),
        None => match entry {
            Entry::App(_, content) => get_raw_multihash(content.clone()),
            _ => Err(ZomeApiError::from(String::from(
                "Given entry is not an app entry",
            ))),
        },
    }?;

    let anchor_address = proxy_address(&final_proxy_address)?;

    if let Entry::App(app_type, _) = entry {
        if app_type.to_string() == String::from("perspective") {
            hdk::link_entries(&anchor_address, &entry_address, "proxy->perspective", "")?;
        } else {
            hdk::link_entries(&anchor_address, &entry_address, "proxy->data", "")?;
        }
    }

    Ok(final_proxy_address)
}

fn get_raw_multihash(content: JsonString) -> ZomeApiResult<Address> {
    hdk::debug(format!("hohoho {:?}", content.to_string().as_str()))?;
    let hashable: serde_json::Value = match serde_json::from_str(content.to_string().as_str()) {
        Ok(value) => Ok(value),
        Err(e) => Err(ZomeApiError::from(format!(
            "Error deserializing json: {:?}",
            e
        ))),
    }?;

    let vec = match to_vec(&hashable) {
        Ok(v) => Ok(v),
        Err(_) => Err(ZomeApiError::from(String::from(
            "Could not serialize content",
        ))),
    }?;

    let mh = Sha2_256::digest(&vec);
    let cid = Cid::new(Version::V1, Codec::DagCBOR, mh).unwrap();

    let encoded = multibase::encode(multibase::Base58btc, cid.to_bytes());

    Ok(Address::from(encoded))
}

pub fn internal_address(maybe_proxy_address: &Address) -> ZomeApiResult<Option<Address>> {
    match hdk::get_entry(&maybe_proxy_address)? {
        Some(_) => Ok(Some(maybe_proxy_address.clone())),
        None => {
            let anchor_address = proxy_address(&maybe_proxy_address)?;

            let links = hdk::get_links(
                &anchor_address,
                LinkMatch::Exactly("proxy->perspective"),
                LinkMatch::Any,
            )?;

            if let Some(a) = links.addresses().get(0) {
                return Ok(Some(a.clone()));
            }

            let data_links = hdk::get_links(
                &anchor_address,
                LinkMatch::Exactly("proxy->data"),
                LinkMatch::Any,
            )?;

            Ok(data_links.addresses().get(0).map(|a| a.clone()))
        }
    }
}
