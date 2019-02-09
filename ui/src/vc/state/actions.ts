import { createHolochainAsyncAction } from '@holochain/hc-redux-middleware';
import { objectFromAddress } from '../types';

const INSTANCE_NAME = 'test-instance';
const ZOME_NAME = 'vc';

export interface AddressRequest {
  address: string;
}

export function createContextAndCommitFromObject(
  store,
  contextName,
  commitMessage,
  objectAddress
) {
  store
    .dispatch(createContext.create({ name: contextName }))
    .then(contextAddress => {
      store
        .dispatch(
          getContextBranches.create({ context_address: contextAddress })
        )
        .then(branchAddresses => {
          store.dispatch(
            createCommit.create({
              branch_address: branchAddresses.addresses[0],
              message: commitMessage,
              content: objectFromAddress(objectAddress)
            })
          );
        });
    });
}

export const createContext = createHolochainAsyncAction<
  { name: string },
  string
>(INSTANCE_NAME, ZOME_NAME, 'create_context');

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

export const mergeBranches = createHolochainAsyncAction<
  { from_branch_address: string; to_branch_address: string },
  string
>(INSTANCE_NAME, ZOME_NAME, 'merge_branches');
