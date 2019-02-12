import { getType } from 'typesafe-actions';
import { AnyAction } from 'redux';
import { createSelector } from 'reselect';

import { Context, Branch, Commit, Object } from '../types';
import { EntityState, createEntityAdapter } from '../utils/entity';
import { getContextInfo } from './actions';
import { RootState } from '../../store';

export interface VersionControlState {
  contexts: EntityState<Context>;
  branches: EntityState<Branch>;
  commits: EntityState<Commit>;
  objects: EntityState<Object>;
}

const contextsAdapter = createEntityAdapter<Context>();
const branchesAdapter = createEntityAdapter<Branch>();
const commitsAdapter = createEntityAdapter<Commit>();
const objectsAdapter = createEntityAdapter<Object>();

const initialState: VersionControlState = {
  contexts: contextsAdapter.getInitialState(),
  branches: branchesAdapter.getInitialState(),
  commits: commitsAdapter.getInitialState(),
  objects: objectsAdapter.getInitialState()
};

export function versionControlReducer(state = initialState, action: AnyAction) {
  console.log(action);
  switch (action.type) {
    case getType(getContextInfo.success):
      return {
        ...state,
        context: contextsAdapter.upsertOne(
          action.payload.Ok.App[1],
          state.contexts
        )
      };
    default:
      return state;
  }
}

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
) => state.commits.entities[selectBranchById(branchId)(state).branch_head];

export const selectObjects = (state: VersionControlState) => state.objects;

export const selectObjectFromBranch = (branchId: string) =>
  createSelector(
    selectBranchHead(branchId),
    selectObjects,
    (commit: Commit, objects: EntityState<Object>) =>
      objects.entities[commit.object_address]
  );

export const selectObjectFromContext = (contextId: string) =>
  createSelector(
    selectContextBranches(contextId),
    s => s,
    (branches: Branch[], state: VersionControlState) =>
      selectObjectFromBranch(branches[0].id)(state)
  );

export const selectCurrentObjects = createSelector(
  [selectContexts, s => s],
  (contexts: Context[], state: VersionControlState) =>
    contexts.map(context => selectObjectFromContext(context.id)(state))
);
