import { VersionControlState, adapters } from '../reducer';
import { createSelector } from 'reselect';
import { EntityState } from '../../utils/entity';
import { Commit, CommitObject } from '../../types';
import { selectObjects } from '../object/selectors';
import { selectContextById, selectContextBranches } from '../context/selectors';
import { stat } from 'mz/fs';

export const selectCommitById = (commitId: string) => (
  state: VersionControlState
) => state.commit.entities[commitId];

export const selectObjectFromCommit = (commitId: string) =>
  createSelector(
    selectCommitById(commitId),
    selectObjects,
    (commit: Commit, objects: EntityState<CommitObject>) =>
      adapters.object.selectById(commit.object_address)(objects)
  );

export const selectContextIdFromCommit = (commitId: string) => (
  state: VersionControlState
) => selectCommitById(commitId)(state).context_address;

export const selectBranchFromCommit = (commitId: string) => (
  state: VersionControlState
) => {
  const contextId = selectContextIdFromCommit(commitId)(state);
  return selectContextBranches(contextId)(state).find(
    branch => branch.branch_head === commitId
  );
};
