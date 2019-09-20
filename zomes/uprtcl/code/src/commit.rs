use crate::proof::{Proof, Secured};
use crate::utils::create_entry;
use hdk::{
    entry_definition::ValidatingEntryType,
    error::ZomeApiResult,
    holochain_core_types::{
        dna::entry_types::Sharing, entry::Entry, validation::EntryValidationData,
    },
    holochain_json_api::{error::JsonError, json::JsonString},
    holochain_persistence_api::cas::content::Address,
    AGENT_ADDRESS
};

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct CommitData {
    pub creatorId: Address,
    pub timestamp: u128,
    pub message: String,

    // Hard links
    pub parentsIds: Vec<Address>,
    pub dataId: Address,
}

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Commit {
    payload: CommitData,
    proof: Proof,
}

impl Commit {
    pub fn new(dataId: Address, parentsIds: Vec<Address>, message: String, timestamp: u128) -> ZomeApiResult<Commit> {
        let commit_data = CommitData {
            dataId,
            parentsIds,
            timestamp,
            message,
            creatorId: AGENT_ADDRESS.clone()
        };

        Commit::from_data(commit_data)
    }
}

impl Secured<CommitData> for Commit {
    fn from_data(commit_data: CommitData) -> ZomeApiResult<Self> {
        let proof = Proof::from(commit_data.clone().into())?;

        Ok(Commit {
            payload: commit_data,
            proof: proof,
        })
    }

    fn entry(&self) -> Entry {
        Entry::App("commit".into(), self.into())
    }

    fn creator_id(&self) -> Address {
        self.payload.creatorId.to_owned()
    }

    fn payload(&self) -> JsonString {
        self.payload.to_owned().into()
    }

    fn proof(&self) -> Proof {
        self.proof.to_owned()
    }
}

pub fn definition() -> ValidatingEntryType {
    entry!(
        name: "commit",
        description: "a commit entry",
        sharing: Sharing::Public,
        validation_package: || {
            hdk::ValidationPackageDefinition::Entry
        },
        validation: |validation_data: hdk::EntryValidationData<Commit>| {
            match validation_data {
                EntryValidationData::Create { entry: commit, .. } => {
                    Proof::verify(commit)
                },
                _ => Err("Cannot modify or delete commits".into())
            }
        }
    )
}

// Public handlers

/**
 * Create the commit with the given input data
 */
pub fn create_commit(dataId: Address, parentsIds: Vec<Address>, message: String, timestamp: u128) -> ZomeApiResult<Address> {
    let commit = Commit::new(dataId, parentsIds, message, timestamp)?;

    create_entry(commit)
}
