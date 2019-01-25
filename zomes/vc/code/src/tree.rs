use crate::blob::Blob;
use boolinator::Boolinator;
use hdk::{
  entry_definition::ValidatingEntryType,
  error::ZomeApiResult,
  holochain_core_types::{
    cas::content::Address, dna::entry_types::Sharing, entry::Entry, error::HolochainError,
    json::JsonString,
  },
};
use std::collections::HashMap;
use std::convert::TryFrom;

/** Structure to store a tree in the DHT */
#[derive(Serialize, Deserialize, Debug, DefaultJson)]
pub struct Tree {
  // <Name of the context in this tree, Address of the referred branch of commit>
  contents: HashMap<String, Address>, 
}

impl Tree {
  fn new(contents: HashMap<String, Address>) -> Tree {
    Tree { contents: contents }
  }
}

pub struct TreeContents {

}

pub fn definition() -> ValidatingEntryType {
  entry!(
      name: "tree",
      description: "a tree object",
      sharing: Sharing::Public,
      native_type: Tree,

      validation_package: || {
        hdk::ValidationPackageDefinition::ChainFull
      },

      validation: |tree: Tree, _ctx: hdk::ValidationData| {
        Ok(())
      },

      links: [
  /*
        TODO: is it necessary to link trees to their children?
        to!(
          "%agent_id",
          tag: "commit_author",
          validation_package: || {
            hdk::ValidationPackageDefinition::ChainFull
          },
          validation: |_source: Address, _target: Address, _ctx: hdk::ValidationData | {
            Ok(())
          }
        ), */
      ]
    )
}

/** Helper functions */

/**
 * Stores the contents of the given tree in the DHT, if it didn't exist before
 */
pub fn store_tree(tree: Tree) -> ZomeApiResult<Address> {
  let tree_entry = Entry::App("tree".into(), tree.into());
  crate::utils::store_entry_if_new(tree_entry)
}

/* 
/**
 * Recursevely goes through the tree, retrieving its contents
 */
pub fn build_tree_content(tree: Tree) -> ZomeApiResult<Option<CommitContent>> {
  let mut contents = HashMap::new();

  // Iterate through the dht addressed map and store the results in a new value map
  for (key, val) in tree.contents.into_iter() {
    if let Some(Entry::App(entry_address, entry_value)) = hdk::get_entry(&val)? {
      match Tree::try_from(&entry_value) {
        Ok(child_tree) => {
          if let Some(child_tree_content) = build_tree_content(child_tree)? {
            contents.insert(key, CommitNode::ChildTree(child_tree_content));
          }
        }
        Err(err) => {
          let blob = Blob::try_from(&entry_value)?;
          contents.insert(key, CommitNode::ChildBlob(blob));
        }
      }
    }
  }

  Ok(Some(CommitContent::new(contents)))
}

pub fn get_tree_content(tree_address: Address) -> ZomeApiResult<Option<CommitContent>> {
  if let Some(Entry::App(_, tree_entry)) = hdk::get_entry(&tree_address)? {
    let tree_contents = Tree::try_from(tree_entry)?;
    return build_tree_content(tree_contents);
  }

  Ok(None)
}

/**
 * Recursevely go through the tree storing its contents
 */
pub fn store_tree_content(content: CommitContent) -> ZomeApiResult<Address> {
  let mut contents: HashMap<String, Address> = HashMap::new();

  for (key, val) in content.contents.into_iter() {
    match val {
      CommitNode::ChildTree(tree) => {
        contents.insert(key, store_tree_content(tree)?);
      }
      CommitNode::ChildBlob(blob) => {
        contents.insert(key, crate::blob::store_blob(blob)?);
      }
    }
  }

  let tree_entry = Entry::App("tree".into(), Tree::new(contents).into());
  let tree_address = hdk::entry_address(&tree_entry)?;

  // If tree doesn't exist, store it
  match hdk::get_entry(&tree_address)? {
    Some(tree) => Ok(tree_address),
    None => hdk::commit_entry(&tree_entry),
  }
}
 */