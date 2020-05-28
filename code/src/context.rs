use crate::versioned_tags;
use hdk::prelude::*;

// Public handlers

/**
 * Create the context with the given input data
 */
pub fn context_address(context: &String) -> ZomeApiResult<Address> {
    holochain_anchors::anchor("context".into(), context.clone())
}

/**
 * Return all perspectives associated to the given context
 */
pub fn get_context_perspectives(context: String) -> ZomeApiResult<Vec<Address>> {
    let address = context_address(&context)?;

    let links = hdk::get_links(
        &address,
        LinkMatch::Exactly("context->perspective"),
        LinkMatch::Any,
    )?;

    Ok(links.addresses())
}

/**
 * Update the context associated to the given perspective
 */
pub fn update_perspective_context(
    perspective_address: &Address,
    context: String,
) -> ZomeApiResult<()> {
    // Remove previous link from context if existent
    let previous_context = get_perspective_context(&perspective_address)?;
    if let Some(c) = previous_context {
        let previous_context_address = context_address(&c)?;
        hdk::remove_link(
            &previous_context_address,
            &perspective_address,
            "context->perspective",
            "",
        )?;
    }

    // Add new bidireccional link
    let context_address = context_address(&context)?;
    versioned_tags::link_with_content(
        &perspective_address,
        &context_address,
        "context".into(),
        JsonString::from_json(&context),
    )?;

    hdk::link_entries(
        &context_address,
        &perspective_address,
        "context->perspective",
        "",
    )?;
    Ok(())
}

/**
 * Get the current context for the perspective
 */
pub fn get_perspective_context(perspective_address: &Address) -> ZomeApiResult<Option<String>> {
    versioned_tags::get_last_content(&perspective_address, "context".into())
}
