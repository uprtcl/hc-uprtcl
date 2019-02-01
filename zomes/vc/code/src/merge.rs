use crate::blob::Blob;
use crate::commit::{
  Commit, CommitContent,
  CommitContent::{ContentBlob, ContentTree},
};
use crate::tree::Tree;
use hdk::{
  error::{ZomeApiError, ZomeApiResult},
  holochain_core_types::{
    cas::content::{Address, Content},
    entry::Entry,
  },
};
use std::cmp::Ordering;
use std::collections::{BinaryHeap, HashMap, HashSet};
use std::convert::TryFrom;

/**
 * Merge the given commits' contents and returns a pointer to the new content
 */
pub fn merge_commits_contents(
  from_commit_address: &Address,
  to_commit_address: &Address,
) -> ZomeApiResult<Address> {
  // If both commits point to the same content, return that content
  let from_commit: Commit =
    Commit::try_from(crate::utils::get_entry_content(from_commit_address)?)?;
  let to_commit: Commit = Commit::try_from(crate::utils::get_entry_content(to_commit_address)?)?;

  if from_commit.get_content_address() == to_commit.get_content_address() {
    return Ok(to_commit.get_content_address().to_owned());
  }

  // Else, compute most recent ancestor and try to merge the contents
  let ancestor_commit_address =
    find_most_recent_common_ancestor(from_commit_address, to_commit_address)?;

  let ancestor_commit: Commit =
    Commit::try_from(crate::utils::get_entry_content(&ancestor_commit_address)?)?;

  let ancestor_content = CommitContent::from(ancestor_commit.get_content_address())?;
  let from_content = CommitContent::from(from_commit.get_content_address())?;
  let to_content = CommitContent::from(to_commit.get_content_address())?;

  merge_content(from_content, to_content, ancestor_content)
}

struct MergeContents {
  from_content: CommitContent,
  to_content: CommitContent,
  ancestor_content: CommitContent,
}

/**
 * Merges the given contents, stores the result and returns its address
 */
fn merge_content(
  from_content: CommitContent,
  to_content: CommitContent,
  ancestor_content: CommitContent,
) -> ZomeApiResult<Address> {
  let merge_result = build_merge_content(from_content, to_content, ancestor_content)?;

  crate::commit::store_commit_content(merge_result)
}

/**
 * Builds the merged content from the given contents
 */
fn build_merge_content(
  from_content: CommitContent,
  to_content: CommitContent,
  ancestor_content: CommitContent,
) -> ZomeApiResult<CommitContent> {

  let merge_contents = MergeContents {
    from_content,
    to_content,
    ancestor_content,
  };

  match merge_contents {
    MergeContents {
      from_content: ContentTree(from_tree),
      to_content: ContentTree(to_tree),
      ancestor_content: ContentTree(ancestor_tree),
    } => {
      let merge_keys: HashSet<&String> = from_tree
        .get_contents()
        .keys()
        .collect::<HashSet<&String>>();
      merge_keys.union(&to_tree.get_contents().keys().collect::<HashSet<&String>>());
      merge_keys.union(
        &ancestor_tree
          .get_contents()
          .keys()
          .collect::<HashSet<&String>>(),
      );

      let mut merged_contents: HashMap<String, Address> = HashMap::new();

      for key in merge_keys.into_iter() {
        if let Some(result_address) = get_merge_result(
          from_tree.get_contents().get(key),
          to_tree.get_contents().get(key),
          ancestor_tree.get_contents().get(key),
        )? {
          merged_contents.insert(key.to_owned(), result_address.to_owned());
        }
      }

      Ok(ContentTree(Tree::new(merged_contents)))
    }
    MergeContents {
      from_content: ContentBlob(from_blob),
      to_content: ContentBlob(to_blob),
      ancestor_content: ContentBlob(ancestor_blob),
    } => {
      let merged_blob = get_merge_result(Some(from_blob), Some(to_blob), Some(ancestor_blob))?;
      Ok(ContentBlob(merged_blob.unwrap()))
    }
    _ => Err(ZomeApiError::from(String::from("conflict"))),
  }
}

fn get_merge_result<T: Eq>(
  maybe_from: Option<T>,
  maybe_to: Option<T>,
  maybe_ancestor: Option<T>,
) -> ZomeApiResult<Option<T>> {
  if maybe_ancestor == maybe_from && maybe_ancestor == maybe_to {
    return Ok(maybe_ancestor);
  } else if maybe_ancestor == maybe_from && maybe_ancestor != maybe_to {
    return Ok(maybe_to);
  } else if maybe_ancestor != maybe_from && maybe_ancestor == maybe_to {
    return Ok(maybe_from);
  } else {
    return Err(ZomeApiError::from(format!(
      "there was a conflict trying to merge"
    )));
  }
}

/** Most recent common ancestor */

#[derive(Clone, Eq, PartialEq)]
struct DistancedCommit {
  commit_address: Address,
  distance: u32,
}

impl DistancedCommit {
  fn new(commit_address: &Address, distance: u32) -> DistancedCommit {
    DistancedCommit {
      commit_address: commit_address.to_owned(),
      distance: distance,
    }
  }
}

impl Ord for DistancedCommit {
  fn cmp(&self, other: &DistancedCommit) -> Ordering {
    other.distance.cmp(&self.distance)
  }
}

impl PartialOrd for DistancedCommit {
  fn partial_cmp(&self, other: &DistancedCommit) -> Option<Ordering> {
    Some(self.cmp(other))
  }
}

/**
 * Computes the most recent common ancestor for the given two nodes
 *
 * Strategy: explore in a BFS the most recent ancestors, stored in a priority queue ordered by
 * distance from original commit
 * Store all visited commits in a HashMap containing only its address, and when we visit an
 * already visited commit, return it
 */
fn find_most_recent_common_ancestor(
  from_commit_address: &Address,
  to_commit_address: &Address,
) -> ZomeApiResult<Address> {
  // Store nodes to visit
  let mut heap: BinaryHeap<DistancedCommit> = BinaryHeap::new();
  // Store visited nodes
  let mut visited_commits: HashMap<Address, u32> = HashMap::new();

  heap.push(DistancedCommit::new(from_commit_address, 0));
  heap.push(DistancedCommit::new(to_commit_address, 0));

  hdk::debug("MERGING: 1")?;

  while let Some(DistancedCommit {
    commit_address,
    distance,
  }) = heap.pop()
  {
    hdk::debug(format!("MERGING: 2 {}", commit_address))?;

    let commit: Commit = Commit::try_from(crate::utils::get_entry_content(&commit_address)?)?;
    let new_distance = distance + 1;

    for parent_commit_address in commit.get_parent_commits_addresses().into_iter() {
      hdk::debug(format!("MERGING: 3 {}", parent_commit_address))?;
      if visited_commits.contains_key(&parent_commit_address) {
        return Ok(parent_commit_address);
      }

      heap.push(DistancedCommit::new(&parent_commit_address, new_distance));
      visited_commits.insert(parent_commit_address, new_distance);
    }
  }

  Err(ZomeApiError::from(String::from(
    "commits don't have a common ancestor",
  )))
}
