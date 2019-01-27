use crate::commit::Commit;
use hdk::{
  error::{ZomeApiError, ZomeApiResult},
  holochain_core_types::{
    cas::content::{Address, Content},
    entry::Entry,
  },
};
use std::convert::TryFrom;

/**
 * Merge the given commits' contents and returns a pointer to the new content
 */
pub fn merge_commits_contents(
  from_commit_address: Address,
  to_commit_address: Address,
) -> ZomeApiResult<Address> {
  let from_commit: Commit =
    Commit::try_from(crate::utils::get_entry_content(&from_commit_address)?)?;
  let to_commit: Commit = Commit::try_from(crate::utils::get_entry_content(&to_commit_address)?)?;
}

fn find_most_recent_common_ancestor(
  from_commit_address: Address,
  to_commit_address: Address,
) -> ZomeApiResult<Address> {
  

}
