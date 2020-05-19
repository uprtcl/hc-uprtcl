use crate::{context, proxy, versioned_tags};
use hdk::prelude::*;

#[derive(Serialize, Deserialize, Debug, self::DefaultJson, Clone)]
pub struct PerspectiveDetails {
    pub name: Option<String>,
    pub context: Option<String>,
    pub head: Option<Address>,
}

pub fn get_perspective_details(perspective_address: Address) -> ZomeApiResult<PerspectiveDetails> {
    let internal_address = match proxy::internal_address(&perspective_address)? {
        Some(address) => Ok(address),
        None => Err(ZomeApiError::from(String::from("Could not find given perspective")))
    }?;

    let head = get_perspective_head(&internal_address)?;
    let name = get_perspective_name(&internal_address)?;
    let context = context::get_perspective_context(&internal_address)?;

    Ok(PerspectiveDetails {
        head,
        context,
        name,
    })
}

pub fn update_perspective_details(
    perspective_address: Address,
    details: PerspectiveDetails,
) -> ZomeApiResult<()> {
    let internal_address = match proxy::internal_address(&perspective_address)? {
        Some(address) => Ok(address),
        None => Err(ZomeApiError::from(String::from("Could not find given perspective")))
    }?;

    if let Some(head_address) = details.head {
        update_perspective_head(&internal_address, &head_address)?;
    }
    if let Some(context) = details.context {
        context::update_perspective_context(&internal_address, context)?;
    }
    if let Some(name) = details.name {
        update_perspective_name(&internal_address, name)?;
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

    versioned_tags::link_with_content(
        &perspective_address,
        &proxy_address,
        "head".into(),
        head_address.clone(),
    )?;

    Ok(())
}

pub fn get_perspective_head(perspective_address: &Address) -> ZomeApiResult<Option<Address>> {
    versioned_tags::get_last_content::<Address>(&perspective_address, "head".into())
}

/**
 * Updates the head commit associated with the given perspective
 */
pub fn update_perspective_name(perspective_address: &Address, name: String) -> ZomeApiResult<()> {
    let anchor_address = holochain_anchors::anchor("name".into(), name.clone())?;

    versioned_tags::link_with_content(&perspective_address, &anchor_address, "name".into(), name)?;

    Ok(())
}

pub fn get_perspective_name(perspective_address: &Address) -> ZomeApiResult<Option<String>> {
    versioned_tags::get_last_content(&perspective_address, "name".into())
}
