use crate::{proxy, versioned_tags};
use hdk::prelude::*;

pub struct PerspectiveDetails {
    pub name: Option<String>,
    pub context: Option<String>,
    pub head: Option<Address>,
}

pub fn get_perspective_details(perspective_address: Address) -> ZomeApiResult<PerspectiveDetails> {
    let head = get_perspective_head(&perspective_address)?;

    Ok(PerspectiveDetails {
        head,
        context: None,
        name: None,
    })
}

pub fn update_perspective_details(
    perspective_address: Address,
    details: PerspectiveDetails,
) -> ZomeApiResult<()> {
    if let Some(head_address) = details.head {
        update_perspective_head(&perspective_address, &head_address)?;
    }

    Ok(())
}

/**
 * Updates the head commit associated with the given perspective
 */
pub fn update_perspective_head(
    perspective_address: &Address,
    head_address: &Address,
) -> ZomeApiResult<()> {
    let proxy_address = proxy::proxy_address(head_address)?;

    versioned_tags::link_with_content(&perspective_address, &proxy_address, "head", head_address)?;

    Ok(())
}

pub fn get_perspective_head(perspective_address: &Address) -> ZomeApiResult<Option<Address>> {
    versioned_tags::get_last_content::<Address>(&perspective_address, "head")
}
