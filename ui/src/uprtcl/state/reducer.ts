import { getType } from 'typesafe-actions';
import { AnyAction } from 'redux';

import { Context, Perspective, Commit } from '../types';
import { RootState } from '../../store';
import {
  getContextHistory,
  getCreatedContexts,
  getAllContexts,
  getRootContext
} from './context/actions';
import { EntityState, createEntityAdapter } from '../../utils/entity';
import { parseEntriesResults, parseEntryResult } from '../../utils/parse';
import { getEntry } from './common/actions';
import { SET_PERSPECTIVE_HEAD } from './perspective/actions';

export interface UprtclState {
  rootContextId: string;
  context: EntityState<Context>;
  perspective: EntityState<Perspective>;
  commit: EntityState<Commit>;
}

export const adapters = {
  context: createEntityAdapter<Context>(),
  perspective: createEntityAdapter<Perspective>(),
  commit: createEntityAdapter<Commit>()
};

const initialState: UprtclState = {
  rootContextId: null,
  context: adapters.context.getInitialState(),
  perspective: adapters.perspective.getInitialState(),
  commit: adapters.commit.getInitialState()
};

export function uprtclReducer(state = initialState, action: AnyAction) {
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
    case getType(getRootContext.success):
      const rootContext = parseEntryResult(action.payload);
      return {
        ...state,
        context: adapters.context.upsertOne(rootContext.entry, state.context),
        rootContextId: rootContext.entry.id
      };
    case SET_PERSPECTIVE_HEAD:
      return {
        ...state,
        perspective: adapters.perspective.updateOne(
          {
            id: action.payload.perspectiveId,
            changes: {
              head: action.payload.commitId
            }
          },
          state.perspective
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

export const selectUprtcl = (state: RootState) => state.uprtcl;
