import { Branch, Context, Commit, CommitObject } from '../types';
import { createSelector } from 'reselect';
import { VersionControlState, commitsAdapter } from './reducer';
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
) => commitsAdapter.selectById(selectBranchHeadId(branchId)(state))(state.commits);

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
    (branches: Branch[], state: VersionControlState) =>
      [
        ...new Set(
          ...branches.map(branch => {
            const head = selectBranchHead(branch.id)(state);
            return head ? selectCommitHistory(head.id)(state) : [];
          })
        )
      ].sort((commit1: Commit, commit2: Commit) => 1)
  );

export const selectCommitHistory = (commitId: string) =>
  createSelector(
    [selectCommitById(commitId), s => s],
    (commit: Commit, state: VersionControlState) =>
      commit
        ? [commit].concat(
            ...commit.parent_commits_addresses.map(parentAddress =>
              selectCommitHistory(parentAddress)(state)
            )
          )
        : null
  );
