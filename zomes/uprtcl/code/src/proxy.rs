use hdk::prelude::*;
use holochain_anchors;

pub fn proxy_address(proxied_address: &Address) -> ZomeApiResult<Address> {
    holochain_anchors::anchor("proxy".into(), proxied_address.into())
}
