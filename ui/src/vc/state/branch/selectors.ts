import { VersionControlState, adapters } from '../reducer';
import { createSelector } from 'reselect';
import { selectObjects } from '../object/selectors';
import { Commit, CommitObject } from '../../types';
import { EntityState } from '../../utils/entity';
import { selectContextById } from '../context/selectors';

export const selectBranchById = (branchId: string) => (
  state: VersionControlState
) => state.branch.entities[branchId];

export const selectBranchHead = (branchId: string) => (
  state: VersionControlState
) =>
  adapters.commit.selectById(selectBranchHeadId(branchId)(state))(state.commit);

export const selectBranchHeadId = (branchId: string) => (
  state: VersionControlState
) => selectBranchById(branchId)(state).branch_head;

export const selectObjectFromBranch = (branchId: string) =>
  createSelector(
    selectBranchHead(branchId),
    selectObjects,
    (commit: Commit, objects: EntityState<CommitObject>) =>
      commit ? objects.entities[commit.object_address] : null
  );

export const selectContextFromBranch = (branchId: string) => (
  state: VersionControlState
) =>
  selectContextById(selectBranchById(branchId)(state).context_address)(state);
