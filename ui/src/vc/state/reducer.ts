import { getType } from 'typesafe-actions';
import { AnyAction } from 'redux';

import { Context, Branch, Commit, CommitObject } from '../types';
import { EntityState, createEntityAdapter } from '../utils/entity';
import {
  parseEntriesResults,
  parseEntryResult
} from '../utils/utils';
import { RootState } from '../../store';
import { getEntry } from './actions/common.actions';
import { SET_BRANCH_HEAD } from './branch/actions';
import { getContextHistory, getCreatedContexts, getAllContexts } from './context/actions';

export interface VersionControlState {
  context: EntityState<Context>;
  branch: EntityState<Branch>;
  commit: EntityState<Commit>;
  object: EntityState<CommitObject>;
}

export const adapters = {
  context: createEntityAdapter<Context>(),
  branch: createEntityAdapter<Branch>(),
  commit: createEntityAdapter<Commit>(),
  object: createEntityAdapter<CommitObject>()
};

const initialState: VersionControlState = {
  context: adapters.context.getInitialState(),
  branch: adapters.branch.getInitialState(),
  commit: adapters.commit.getInitialState(),
  object: adapters.object.getInitialState()
};

export function versionControlReducer(state = initialState, action: AnyAction) {
  console.log(state);
  console.log(action);
  switch (action.type) {
    case getType(getCreatedContexts.success):
    case getType(getAllContexts.success):
      return {
        ...state,
        context: adapters.context.upsertMany(
          parseEntriesResults(action.payload).map(result => result.entry),
          state.context
        )
      };
    case getType(getEntry.success):
      const result = parseEntryResult(action.payload);
      if (!state[result.type]) return state;
      return {
        ...state,
        [result.type]: adapters[result.type].upsertOne(
          result.entry,
          state[result.type]
        )
      };
    case SET_BRANCH_HEAD:
      return {
        ...state,
        branch: adapters.branch.updateOne(
          {
            id: action.payload.branchId,
            changes: {
              branch_head: action.payload.commitId
            }
          },
          state.branch
        )
      };
    case getType(getContextHistory.success):
      return {
        ...state,
        commit: adapters.commit.upsertMany(
          parseEntriesResults(action.payload).map(result => result.entry),
          state.commit
        )
      };

    default:
      return state;
  }
}

export const selectVersionControl = (state: RootState) => state.versionControl;
