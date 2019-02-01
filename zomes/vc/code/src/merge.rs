use crate::commit::Commit;
use hdk::{
  error::{ZomeApiError, ZomeApiResult},
  holochain_core_types::{
    cas::content::{Address, Content},
    entry::Entry,
  },
};
use std::convert::TryFrom;
use std::cmp::Ordering;
use std::collections::{BinaryHeap, HashMap};

/**
 * Merge the given commits' contents and returns a pointer to the new content
 */
pub fn merge_commits_contents(
  from_commit_address: Address,
  to_commit_address: Address,
) -> ZomeApiResult<Address> {

  find_most_recent_common_ancestor(&from_commit_address, &to_commit_address)
}

#[derive(Clone, Eq, PartialEq)]
struct DistancedCommit {
  commit_address: Address,
  distance: u32
}

impl DistancedCommit {
  fn new(commit_address: &Address, distance: u32) -> DistancedCommit {
    DistancedCommit {
      commit_address: commit_address.to_owned(),
      distance: distance
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

  while let Some(DistancedCommit { commit_address, distance }) = heap.pop() {
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

  Err(ZomeApiError::from(String::from("commits don't have a common ancestor")))
}
