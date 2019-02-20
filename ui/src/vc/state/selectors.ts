import {
  Branch,
  Context,
  Commit,
  CommitObject,
  ChildrenCommit,
  ContextHistory
} from '../types';
import { createSelector } from 'reselect';
import { VersionControlState, commitsAdapter, objectsAdapter } from './reducer';
import { EntityState } from '../utils/entity';
import { RootState } from '../../store';

export const selectVersionControl = (state: RootState) => state.versionControl;

export const selectContexts = (state: VersionControlState) =>
  state.contexts.ids.map(id => state.contexts.entities[id]);

export const selectContextById = (contextId: string) => (
  state: VersionControlState
) => state.contexts.entities[contextId];

export const selectContextBranches = (contextId: string) => (
  state: VersionControlState
) =>
  state.branches.ids
    .map(id => state.branches.entities[id])
    .filter(branch => branch.context_address === contextId);

export const selectBranchById = (branchId: string) => (
  state: VersionControlState
) => state.branches.entities[branchId];

export const selectCommitById = (commitId: string) => (
  state: VersionControlState
) => state.commits.entities[commitId];

export const selectBranchHead = (branchId: string) => (
  state: VersionControlState
) =>
  commitsAdapter.selectById(selectBranchHeadId(branchId)(state))(state.commits);

export const selectBranchHeadId = (branchId: string) => (
  state: VersionControlState
) => selectBranchById(branchId)(state).branch_head;

export const selectObjects = (state: VersionControlState) => state.objects;

export const selectObjectFromBranch = (branchId: string) =>
  createSelector(
    selectBranchHead(branchId),
    selectObjects,
    (commit: Commit, objects: EntityState<CommitObject>) =>
      commit ? objects.entities[commit.object_address] : null
  );

export const selectObjectFromContext = (contextId: string) =>
  createSelector(
    selectContextBranches(contextId),
    s => s,
    (branches: Branch[], state: VersionControlState) =>
      branches.length > 0 ? selectObjectFromBranch(branches[0].id)(state) : null
  );

export const selectObjectFromCommit = (commitId: string) =>
  createSelector(
    selectCommitById(commitId),
    selectObjects,
    (commit: Commit, objects: EntityState<CommitObject>) =>
      objectsAdapter.selectById(commit.object_address)(objects)
  );

export const selectCurrentObjects = createSelector(
  [selectContexts, s => s],
  (contexts: Context[], state: VersionControlState) =>
    contexts
      .map(context => selectObjectFromContext(context.id)(state))
      .filter(o => o != null)
);

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
