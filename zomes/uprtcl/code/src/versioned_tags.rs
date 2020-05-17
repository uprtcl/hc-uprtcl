use hdk::holochain_wasm_utils::api_serialization::get_links::LinksResult;
use hdk::prelude::*;
use std::convert::TryFrom;

pub fn link_with_content<T>(
    base: &Address,
    target: &Address,
    link_type: &str,
    tag_content: T,
) -> ZomeApiResult<Address>
where
    T: Into<JsonString> + Clone,
{
    let count = hdk::get_links_count(&base, LinkMatch::Exactly(link_type), LinkMatch::Any)?;

    let tag = serialize_tag::<T>(tag_content, count.count);

    hdk::link_entries(&base, &target, link_type, tag.as_str())
}

pub fn get_last_link(base: &Address, link_type: &str) -> ZomeApiResult<Option<LinksResult>> {
    let links_result = hdk::get_links(&base, LinkMatch::Exactly(link_type), LinkMatch::Any)?;

    let mut links = links_result.links();

    links.sort_by(|t1, t2| count_from_tag(t2.tag).cmp(&count_from_tag(t1.tag)));

    Ok(links.get(0).map(|l| l.clone()))
}

pub fn get_last_content<T>(base: &Address, link_type: &str) -> ZomeApiResult<Option<T>>
where
    T: TryFrom<JsonString>,
{
    let link_result = get_last_link(&base, link_type)?;

    match link_result {
        Some(link) => deserialize_tag::<T>(link.tag).map(|t| Some(t.0)),
        None => Ok(None),
    }
}

/** Private helpers **/

fn serialize_tag<T>(tag_content: T, count: usize) -> String
where
    T: Into<JsonString>,
{
    let content: JsonString = tag_content.into();
    format!("content:{:?},count:{}", content, count)
}

fn count_from_tag(tag: String) -> usize {
    let split: Vec<&str> = tag.split(",").collect();
    let count: &str = String::from(split[1]).split(":").collect::<Vec<&str>>()[1];

    match count.parse::<usize>() {
        Ok(c) => c,
        Err(_) => 0,
    }
}

fn deserialize_tag<T>(tag: String) -> ZomeApiResult<(T, usize)>
where
    T: TryFrom<JsonString>,
{
    let split: Vec<&str> = tag.split(",").collect();

    let content: &str = String::from(split[0]).split(":").collect::<Vec<&str>>()[1];
    let count: &str = String::from(split[1]).split(":").collect::<Vec<&str>>()[1];

    let jsonstring: JsonString = JsonString::from_json(content);

    match T::try_from(jsonstring) {
        Ok(result) => Ok((result, String::from(count).parse::<usize>().unwrap())),
        Err(_) => Err(ZomeApiError::from(String::from(
            "Could not deserialize tag",
        ))),
    }
}
