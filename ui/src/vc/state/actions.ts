import { createHolochainAsyncAction } from '@holochain/hc-redux-middleware';
import { CommitObject, Branch, Context } from '../types';
import { ThunkAction } from 'redux-thunk';
import {
  parseEntriesResults,
  parseEntry,
  parseEntryResult,
  getIfNotCached
} from '../utils/utils';
import {
  selectVersionControl,
  selectBranchHead,
  selectBranchHeadId,
  selectObjects,
  selectContextById,
  selectObjectFromContext
} from './selectors';
import { objectsAdapter, commitsAdapter } from './reducer';
import { Action, Dispatch } from 'redux';
import { RootState } from '../../store';

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

export const getContextHistory = createHolochainAsyncAction<
  { context_address: string },
  string
>(INSTANCE_NAME, ZOME_NAME, 'get_context_history');

export function getCachedCommitInfo(commitAddress: string) {
  return dispatch =>
    dispatch(
      getIfNotCached(
        commitAddress,
        (rootState: RootState) => selectVersionControl(rootState).commits,
        commitsAdapter,
        getCommitInfo.create({ commit_address: commitAddress })
      )
    );
}

export function getChildrenContexts(contextId: string) {
  return (dispatch, getState) => {
    const object: CommitObject = selectObjectFromContext(contextId)(
      selectVersionControl(getState())
    );
    return Promise.all(
      Object.keys(object.links).map(childContextAddress =>
        dispatch(
          getContextInfo.create({ context_address: childContextAddress })
        )
      )
    );
  };
}

export function getCreatedContextsAndContents() {
  return dispatch => {
    dispatch(getCreatedContexts.create({})).then(response =>
      Promise.all([
        parseEntriesResults(response).map(entry =>
          getContextBranchesInfo(entry.id)
        )
      ])
    );
  };
}

export function getContextBranchesInfo(contextAddress: string) {
  return dispatch =>
    dispatch(
      getContextBranches.create({ context_address: contextAddress })
    ).then(addressesResult =>
      Promise.all(
        addressesResult.addresses.map((branchAddress: string) =>
          dispatch(getBranchAndHead(branchAddress))
        )
      )
    );
}

export function getBranchAndHead(branchAddress: string) {
  return dispatch =>
    dispatch(getBranchInfo.create({ branch_address: branchAddress })).then(
      branchEntry => dispatch(getBranchHeadCommit(branchAddress))
    );
}

function getBranchHeadCommit(branchAddress: string) {
  return (dispatch: Dispatch) => {
    return dispatch(
      getBranchHead.create({ branch_address: branchAddress })
    ).then((commitAddress: string) =>
      dispatch(setBranchHead(branchAddress, commitAddress))
    );
  };
}

export function getBranchHeadCommitContent(branchAddress: string) {
  return (dispatch, getState) => {
    const branchHead = selectBranchHeadId(branchAddress)(
      selectVersionControl(getState())
    );

    return dispatch(getCommitAndContents(branchHead));
  };
}

export function getCommitAndContents(commitAddress: string) {
  return dispatch => {
    dispatch(getCommitInfo.create({ commit_address: commitAddress }));

    return dispatch(
      getCommitContent.create({ commit_address: commitAddress })
    ).then((commitObjectEntry: CommitObject) => {
      const commitObject: CommitObject = parseEntryResult(commitObjectEntry);

      return dispatch(getObjectEntries(commitObject.id));
    });
  };
}

export function getObjectEntries(objectId: string) {
  return (dispatch, getState) => {
    const commitObject: CommitObject = objectsAdapter.selectById(objectId)(
      selectObjects(selectVersionControl(getState()))
    );
    const entriesAddresses = Object.keys(commitObject.links).map(
      key => commitObject.links[key]
    );
    entriesAddresses.push(commitObject.data);

    return Promise.all(
      entriesAddresses.map(address => dispatch(getEntry.create({ address })))
    );
  };
}
