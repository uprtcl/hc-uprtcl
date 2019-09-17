use hdk::{
    error::ZomeApiResult,
    holochain_core_types::{
        entry::Entry,
        signature::{Provenance, Signature},
    },
    holochain_json_api::{error::JsonError, json::JsonString},
    holochain_persistence_api::cas::content::Address,
};

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Proof {
    r#type: String,
    signature: String,
}

impl Proof {
    pub fn from(payload: JsonString) -> ZomeApiResult<Proof> {
        let signature = hdk::sign(payload)?;

        Ok(Proof {
            r#type: String::from("ECDSA"),
            signature: signature,
        })
    }

    pub fn verify<S, T>(secured: T) -> Result<(), String>
    where
        T: Secured<S>,
    {
        let proof = secured.proof();
        let provenance = Provenance::new(secured.creator_id(), Signature::from(proof.signature));

        match hdk::verify_signature(provenance, secured.payload())? {
            true => Ok(()),
            false => Err(String::from("Failed to verify signature")),
        }
    }
}

pub trait Secured<S>
where
    Self: Sized,
{
    fn from_data(data: S) -> ZomeApiResult<Self>;
    fn entry(&self) -> Entry;
    fn creator_id(&self) -> Address;
    fn payload(&self) -> JsonString;
    fn proof(&self) -> Proof;
}
