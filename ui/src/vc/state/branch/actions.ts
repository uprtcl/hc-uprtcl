import { INSTANCE_NAME, ZOME_NAME } from '../actions/common.actions';
import { createHolochainAsyncAction } from '@holochain/hc-redux-middleware';
import { getCommitAndContent } from '../commit/actions';
import { getCachedEntry } from '../actions/cached.actions';
import { Branch, EntryResult } from '../../types';
import { selectBranchHeadId } from './selectors';
import { selectVersionControl } from '../reducer';

/** Holochain actions */

export const createBranch = createHolochainAsyncAction<
  { commit_address: string; name: string },
  string
>(INSTANCE_NAME, ZOME_NAME, 'create_branch');

export const getBranchHead = createHolochainAsyncAction<
  { branch_address: string },
  string
>(INSTANCE_NAME, ZOME_NAME, 'get_branch_head');

export const mergeBranches = createHolochainAsyncAction<
  { from_branch_address: string; to_branch_address: string },
  string
>(INSTANCE_NAME, ZOME_NAME, 'merge_branches');

/** Common action */

export const SET_BRANCH_HEAD = 'SET_BRANCH_HEAD';

export function setBranchHead(branchId: string, commitId: string) {
  return {
    type: SET_BRANCH_HEAD,
    payload: {
      branchId,
      commitId
    }
  };
}

/** Helper actions */

export function getBranchInfo(branchAddress: string) {
  return dispatch =>
    dispatch(getCachedEntry(branchAddress, ['branch'])).then(
      (result: EntryResult<Branch>) => {
        if (!result.entry.branch_head) {
          return dispatch(
            getBranchHead.create({ branch_address: branchAddress })
          ).then((commitAddress: string) =>
            dispatch(setBranchHead(branchAddress, commitAddress))
          );
        }
        return result.entry;
      }
    );
}

/**
 * Gets the branch head commit's info and contents
 */
export function getBranchContent(branchAddress: string) {
  return (dispatch, getState) => {
    const branchHead = selectBranchHeadId(branchAddress)(
      selectVersionControl(getState())
    );

    return dispatch(getCommitAndContent(branchHead));
  };
}

export function getBranchAndContent(branchAddress: string) {
  return dispatch =>
    dispatch(getBranchInfo(branchAddress)).then(() =>
      dispatch(getBranchContent(branchAddress))
    );
}
