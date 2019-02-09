import { getType } from 'typesafe-actions';
import { AnyAction } from 'redux';
import { Context, Branch, Commit, Object } from '../types';
import { EntityState, createEntityAdapter } from '../utils/entity';
import { getContextInfo } from './actions';

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
