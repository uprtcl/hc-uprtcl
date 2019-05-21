import { AnyAction } from 'redux';

import { Context, Perspective, Commit } from '../types';
import { RootState } from '../../store';
import {
  GET_CONTEXT,
  GET_ROOT_PERSPECTIVE,
  GET_CONTEXT_PERSPECTIVES
} from './context/actions';
import { EntityState, createEntityAdapter } from '../../utils/entity';
import { SET_PERSPECTIVE_HEAD, GET_PERSPECTIVE } from './perspective/actions';
import { GET_COMMIT } from './commit/actions';
import { Resolver } from '../../services/resolver';
import { UprtclHolochain } from '../services/uprtcl.holochain';
import { UprtclService } from '../services/uprtcl.service';

export interface UprtclState {
  rootPerspectiveId: string;
  contexts: EntityState<Context>;
  perspectives: EntityState<Perspective>;
  commits: EntityState<Commit>;
}

export const adapters = {
  contexts: createEntityAdapter<Context>(),
  perspectives: createEntityAdapter<Perspective>(),
  commits: createEntityAdapter<Commit>()
};

const initialState: UprtclState = {
  rootPerspectiveId: null,
  contexts: adapters.contexts.getInitialState(),
  perspectives: adapters.perspectives.getInitialState(),
  commits: adapters.commits.getInitialState()
};

export function uprtclReducer(state = initialState, action: AnyAction) {
  console.log(state);
  console.log(action);
  switch (action.type) {
    case GET_CONTEXT.successType:
      return {
        ...state,
        contexts: adapters.contexts.upsertOne(action.payload, state.contexts)
      };
    case GET_PERSPECTIVE.successType:
      return {
        ...state,
        perspectives: adapters.perspectives.upsertOne(
          action.payload,
          state.perspectives
        )
      };
    case GET_COMMIT.successType:
      return {
        ...state,
        commits: adapters.commits.upsertOne(action.payload, state.commits)
      };
    case GET_ROOT_PERSPECTIVE.successType:
      return {
        ...state,
        perspectives: adapters.perspectives.upsertOne(
          action.payload,
          state.perspectives
        ),
        rootPerspectiveId: action.payload.id
      };
    case SET_PERSPECTIVE_HEAD:
      return {
        ...state,
        perspectives: adapters.perspectives.updateOne(
          {
            id: action.payload.perspectiveId,
            changes: {
              headLink: action.payload.commitId
            }
          },
          state.perspectives
        )
      };

    case GET_CONTEXT_PERSPECTIVES.successType:
      return {
        ...state,
        perspectives: adapters.perspectives.upsertMany(
          action.payload,
          state.perspectives
        )
      };

    default:
      return state;
  }
}

export const selectUprtcl = (state: RootState) => state.uprtcl;

export const uprtclResolver = new Resolver<UprtclService>({
  holochain: {
    'test-instance': new UprtclHolochain()
  }
});

export const uprtclHolochain = uprtclResolver.getResolver(
  'holochain',
  'test-instance'
);
