import { createHolochainAsyncAction } from '@holochain/hc-redux-middleware';
import { CommitObject, Branch } from '../types';
import { Store } from 'redux';
import {
  parseEntriesResults,
  parseEntry,
  parseEntryResult
} from '../utils/utils';

const INSTANCE_NAME = 'test-instance';
const ZOME_NAME = 'vc';

export interface AddressRequest {
  address: string;
}

export const SET_BRANCH_HEAD = 'SET_BRANCH_HEAD';

interface SetBranchAction {
  type: typeof SET_BRANCH_HEAD;
  payload: {
    branchId: string;
    commitId: string;
  };
}

export function setBranchHead(branchId: string, commitId: string) {
  return {
    type: SET_BRANCH_HEAD,
    payload: {
      branchId,
      commitId
    }
  };
}

export const createContext = createHolochainAsyncAction<
  { name: string },
  string
>(INSTANCE_NAME, ZOME_NAME, 'create_context');

export const createContextAndCommit = createHolochainAsyncAction<
  { name: string; message: string; content: CommitObject },
  string
>(INSTANCE_NAME, ZOME_NAME, 'create_context_and_commit');

export const getCreatedContexts = createHolochainAsyncAction<{}, any>(
  INSTANCE_NAME,
  ZOME_NAME,
  'get_created_contexts'
);

export const getContextInfo = createHolochainAsyncAction<
  { context_address: string },
  any
>(INSTANCE_NAME, ZOME_NAME, 'get_context_info');

export const createBranch = createHolochainAsyncAction<
  { commit_address: string; name: string },
  string
>(INSTANCE_NAME, ZOME_NAME, 'create_branch');

export const getContextBranches = createHolochainAsyncAction<
  { context_address: string },
  any
>(INSTANCE_NAME, ZOME_NAME, 'get_context_branches');

export const getBranchInfo = createHolochainAsyncAction<
  { branch_address: string },
  any
>(INSTANCE_NAME, ZOME_NAME, 'get_branch_info');

export const getBranchHead = createHolochainAsyncAction<
  { branch_address: string },
  string
>(INSTANCE_NAME, ZOME_NAME, 'get_branch_head');

export const createCommit = createHolochainAsyncAction<
  { branch_address: string; message: string; content: any },
  string
>(INSTANCE_NAME, ZOME_NAME, 'create_commit');

export const getCommitInfo = createHolochainAsyncAction<
  { commit_address: string },
  any
>(INSTANCE_NAME, ZOME_NAME, 'get_commit_info');

export const getCommitContent = createHolochainAsyncAction<
  { commit_address: string },
  any
>(INSTANCE_NAME, ZOME_NAME, 'get_commit_content');

export const getEntry = createHolochainAsyncAction<{ address: string }, any>(
  INSTANCE_NAME,
  ZOME_NAME,
  'get_entry'
);

export const mergeBranches = createHolochainAsyncAction<
  { from_branch_address: string; to_branch_address: string },
  string
>(INSTANCE_NAME, ZOME_NAME, 'merge_branches');

export function getCreatedContextsAndContents(store: Store) {
  return new Promise(resolve => {
    store
      .dispatch(getCreatedContexts.create({}))
      .then(response =>
        parseEntriesResults(response).map(entry =>
          getContextBranchesInfo(store, entry.id).then(() => resolve())
        )
      );
  });
}

export function getContextBranchesInfo(store: Store, contextAddress: string) {
  return new Promise(resolve => {
    store
      .dispatch(getContextBranches.create({ context_address: contextAddress }))
      .then(addressesResult =>
        addressesResult.addresses.forEach(branchAddress => {
          store
            .dispatch(getBranchInfo.create({ branch_address: branchAddress }))
            .then(branchEntry => resolve());
        })
      );
  });
}

export function getBranchAndContents(store: Store, branchAddress: string) {
  return new Promise(resolve => {
    store
      .dispatch(getBranchHead.create({ branch_address: branchAddress }))
      .then(commitAddress => {
        store.dispatch(setBranchHead(branchAddress, commitAddress));
        getCommitContents(store, commitAddress).then(() => resolve());
      });
  });
}

export function getCommitContents(store: Store, commitAddress: string) {
  return new Promise(resolve => {
    store.dispatch(getCommitInfo.create({ commit_address: commitAddress }));

    store
      .dispatch(getCommitContent.create({ commit_address: commitAddress }))
      .then((commitObjectEntry: CommitObject) => {
        const commitObject = parseEntryResult(commitObjectEntry);
        const entriesAddresses = Object.keys(commitObject.subcontent).map(
          key => commitObject.subcontent[key]
        );
        entriesAddresses.push(commitObject.data);

        Promise.all(
          entriesAddresses.map(address =>
            store.dispatch(getEntry.create({ address }))
          )
        ).then(() => resolve());
      });
  });
}
