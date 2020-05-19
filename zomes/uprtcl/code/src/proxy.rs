use hdk::prelude::*;
use holochain_anchors;

pub fn proxy_address(proxied_address: &Address) -> ZomeApiResult<Address> {
    holochain_anchors::anchor("proxy".into(), proxied_address.to_string())
}

pub fn set_entry_proxy(
    proxied_address: &Address,
    entry_address: &Address,
) -> ZomeApiResult<()> {
    let anchor_address = proxy_address(&proxied_address)?;

    hdk::link_entries(&anchor_address, &entry_address, "proxy", "")?;

    Ok(())
}

pub fn internal_address(maybe_proxy_address: &Address) -> ZomeApiResult<Option<Address>> {
    match hdk::get_entry(&maybe_proxy_address)? {
        Some(_) => Ok(Some(maybe_proxy_address.clone())),
        None => {
            let anchor_address = proxy_address(&maybe_proxy_address)?;

            let links = hdk::get_links(&anchor_address, LinkMatch::Exactly("proxy"), LinkMatch::Any)?;
            
            Ok(links.addresses().get(0).map(|a|a.clone()))
        }
    }
}