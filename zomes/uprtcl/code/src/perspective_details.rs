use crate::proxy;
use hdk::prelude::*;

pub struct PerspectiveDetails {
    pub name: Option<String>,
    pub context: Option<String>,
    pub head: Option<Address>,
}

pub fn get_perspective_details(perspective_address: Address) -> ZomeApiResult<PerspectiveDetails> {}

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

    let count = get_head_count(&perspective_address)?;

    hdk::link_entries(
        perspective_address,
        &proxy_address,
        "head",
        serialize_tag(head_address, count).as_str(),
    )?;

    Ok(())
}

pub fn get_perspective_head(perspective_address: &Address) -> ZomeApiResult<Option<Address>> {
    let links = hdk::get_links(
        perspective_address,
        LinkMatch::Exactly("head"),
        LinkMatch::Any,
    )?;

    let mut tags: Vec<(Address, usize)> = links
        .tags()
        .into_iter()
        .map(|t| deserialize_tag(t))
        .collect();

    tags.sort_by(|t1, t2| t2.1.cmp(&t1.1));

    Ok(tags.get(0).map(|t: &(Address, usize)| t.0))
}

fn get_head_count(perspective_address: &Address) -> ZomeApiResult<usize> {
    let links_count = hdk::get_links_count(
        &perspective_address,
        LinkMatch::Exactly("head"),
        LinkMatch::Any,
    )?;
    Ok(links_count.count)
}

fn serialize_tag(head_address: &Address, count: usize) -> String {
    format!("head:{:?},count:{}", head_address, count)
}

fn deserialize_tag(tag: String) -> (Address, usize) {
    let split: Vec<&str> = tag.split(",").collect();

    let address: &str = String::from(split[0]).split(":").collect::<Vec<&str>>()[1];
    let count: &str = String::from(split[1]).split(":").collect::<Vec<&str>>()[1];

    (
        Address::from(String::from(address)),
        String::from(count).parse::<usize>().unwrap(),
    )
}
