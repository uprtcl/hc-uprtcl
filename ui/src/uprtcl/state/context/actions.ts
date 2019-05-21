import { asyncAction } from '../common/actions';
import { uprtclHolochain } from '../reducer';
import { Perspective, Context } from '../../types';
import { getPerspective } from '../perspective/actions';

export const GET_CONTEXT = asyncAction<{ contextId: string }, Context>(
  'get_context'
);

export function getContext(contextId: string) {
  return dispatch =>
    uprtclHolochain
      .getContext(contextId)
      .then(context => dispatch(GET_CONTEXT.success(context)));
}

export const CREATE_CONTEXT = asyncAction<
  { name: string; timestamp: number },
  string
>('create_context');

export function createContext() {
  return dispatch =>
    uprtclHolochain
      .createContext({
        creatorId: '',
        timestamp: Date.now(),
        nonce: 0
      })
      .then(contextId => dispatch(CREATE_CONTEXT.success(contextId)));
}

export const GET_CONTEXT_PERSPECTIVES = asyncAction<
  { contextId: string },
  Perspective[]
>('get_context_perspectives');

export function getContextPerspectives(contextId: string) {
  return dispatch =>
    uprtclHolochain.getContextPerspectives(contextId).then(perspectives => {
      dispatch(GET_CONTEXT_PERSPECTIVES.success(perspectives));
      return perspectives;
    });
}

export const GET_ROOT_PERSPECTIVE = asyncAction<{}, Perspective>(
  'GET_ROOT_PERSPECTIVE'
);

export function getRootPerspective() {
  return dispatch =>
    uprtclHolochain
      .getRootPerspective()
      .then(context => dispatch(GET_ROOT_PERSPECTIVE.success(context)));
}

/** Helper actions */

export function getContextContent(contextId: string) {
  return dispatch =>
    Promise.all([
      dispatch(getContext(contextId)),
      dispatch(getContextPerspectives(contextId))
    ]);
}
