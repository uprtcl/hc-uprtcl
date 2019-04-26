use hdk::{
  entry_definition::ValidatingEntryType,
  error::{ZomeApiError, ZomeApiResult},
  holochain_core_types::{
    cas::content::Address, dna::entry_types::Sharing, entry::Entry, error::HolochainError,
    json::JsonString,
  },
};
use holochain_wasm_utils::api_serialization::get_entry::{GetEntryOptions, GetEntryResult};
use std::convert::TryFrom;

#[derive(Eq, PartialEq, Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Link {
  pub name: String,
  pub address: Address,
}

impl Link {
  pub fn new(name: &String, address: &Address) -> Link {
    Link {
      name: name.clone(),
      address: address.clone(),
    }
  }
}

#[derive(Eq, PartialEq, Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Content {
  data: Option<Address>,
  links: Vec<Link>,
}

impl Content {
  pub fn new(data: Option<Address>, links: Vec<Link>) -> Content {
    Content {
      data: data,
      links: links,
    }
  }

  pub fn from(content_address: &Address) -> ZomeApiResult<Content> {
    match Content::try_from(crate::utils::get_entry_content(content_address)?) {
      Ok(content) => Ok(content),
      Err(err) => Err(ZomeApiError::from(err)),
    }
  }

  pub fn get_data(&self) -> Option<Address> {
    self.data.to_owned()
  }

  pub fn get_links(&self) -> &Vec<Link> {
    &self.links
  }
}

pub fn definition() -> ValidatingEntryType {
  entry!(
    name: "content",
    description: "an abstract content",
    sharing: Sharing::Public,

    validation_package: || {
      hdk::ValidationPackageDefinition::ChainFull
    },

    validation: |_validation_data: hdk::EntryValidationData<Content>| {
      Ok(())
    },

    links: []
  )
}

/** Exposed zome functions */

pub fn handle_get_entry(address: Address) -> ZomeApiResult<GetEntryResult> {
  hdk::get_entry_result(&address, GetEntryOptions::default())
}

/** Helper functions */

/**
 * Stores the contents of the given tree in the DHT, if it didn't exist before
 */
pub fn store_content(content: Content) -> ZomeApiResult<Address> {
  let content_entry = Entry::App("content".into(), content.into());
  crate::utils::store_entry_if_new(content_entry)
}

/*
  Stores the contents of the commit in the DHT
  pub fn store_content_object(content: ContentObject) -> ZomeApiResult<Address> {
  let mut links: HashMap<String, Address> = HashMap::new();

  for (key, links_object) in content.links.into_iter() {
    links.insert(key, store_content_object(links_object)?);
  }

  let object_entry = Entry::App(
    "object".into(),
    Object::new(content.data, links).into(),
  );
  crate::utils::store_entry_if_new(object_entry)
}
 */
