import { VersionControlState, adapters } from '../reducer';
import { createSelector } from 'reselect';
import { EntityState } from '../../utils/entity';
import { Commit, CommitObject } from '../../types';
import { selectObjects } from '../object/selectors';
import { selectContextById } from '../context/selectors';

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

export const selectContextFromCommit = (commitId: string) => (
  state: VersionControlState
) =>
  selectContextById(selectCommitById(commitId)(state).context_address)(state);
