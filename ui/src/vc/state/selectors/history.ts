import { createSelector } from 'reselect';
import { selectContextBranches } from '../context/selectors';
import { VersionControlState } from '../reducer';
import { Branch, ChildrenCommit, Commit } from '../../types';
import { selectBranchHeadId } from '../branch/selectors';
import { selectCommitById } from '../commit/selectors';

export const selectContextHistory = (contextId: string) =>
createSelector(
  [selectContextBranches(contextId), s => s],
  (branches: Branch[], state: VersionControlState) => {
    let contextHistory: { [key: string]: ChildrenCommit } = {};
    for (const branch of branches) {
      const headId = selectBranchHeadId(branch.id)(state);
      const branchHistory = selectCommitHistory(headId)(state);

      Object.keys(branchHistory).forEach(key => {
        if (contextHistory[key]) {
          contextHistory[key].children_commits_addresses.push(
            ...branchHistory[key].children_commits_addresses
          );
        } else {
          contextHistory[key] = branchHistory[key];
        }
      });
    }

    const ids = Object.keys(contextHistory).sort(
      (id1: string, id2: string) => 1
    );
    const originalCommitId = Object.keys(contextHistory).find(
      commitId =>
        contextHistory[commitId].parent_commits_addresses.length === 0
    );

    return {
      entities: contextHistory,
      ids: ids,
      originalCommitAddress: originalCommitId
    };
  }
);

export const selectCommitHistory = (commitId: string) =>
createSelector(
  [selectCommitById(commitId), s => s],
  (commit: Commit, state: VersionControlState) => {
    if (!commit) {
      return {};
    }

    let history: { [key: string]: ChildrenCommit } = {};
    for (const parentAddress of commit.parent_commits_addresses) {
      const parentHistory: {
        [key: string]: ChildrenCommit;
      } = selectCommitHistory(parentAddress)(state);

      if (parentHistory[parentAddress]) {
        parentHistory[parentAddress].children_commits_addresses.push(
          commitId
        );
      }

      history = {
        ...history,
        ...parentHistory
      };
    }

    history[commitId] = {
      ...commit,
      children_commits_addresses: []
    };

    return history;
  }
);
