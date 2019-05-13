import { asyncAction } from '../common/actions';
import { universalUprtcl } from '../reducer';
import { Perspective, Context } from '../../types';
import { getPerspective } from '../perspective/actions';

export const GET_CONTEXT = asyncAction<{ contextId: string }, Context>(
  'get_context'
);

export function getContext(contextId: string) {
  return dispatch =>
    universalUprtcl
      .getContext(contextId)
      .then(context => dispatch(GET_CONTEXT.success(context)));
}

export const CREATE_CONTEXT = asyncAction<
  { name: string; timestamp: number },
  string
>('create_context');

export function createContext() {
  return dispatch =>
    universalUprtcl
      .createContext()
      .then(contextId => dispatch(CREATE_CONTEXT.success(contextId)));
}

export const GET_CONTEXT_PERSPECTIVES = asyncAction<
  { contextId: string },
  Perspective[]
>('get_context_perspectives');

export function getContextPerspectives(contextId: string) {
  return dispatch =>
    universalUprtcl
      .getContextPerspectives(contextId)
      .then(perspectives =>
        dispatch(GET_CONTEXT_PERSPECTIVES.success(perspectives))
      );
}

export const GET_ROOT_CONTEXT = asyncAction<{}, Context>(
  'get_context_perspectives'
);

export function getRootContext() {
  return dispatch =>
    universalUprtcl
      .getRootContext()
      .then(context => dispatch(GET_ROOT_CONTEXT.success(context)));
}

/** Helper actions */

export function getContextContent(contextId: string) {
  return dispatch =>
    Promise.all([
      dispatch(getContext(contextId)),
      dispatch(getContextPerspectives(contextId)).then(addressesResult =>
        Promise.all(
          addressesResult.links.map(({ address: perspectiveAddress }) =>
            dispatch(getPerspective(perspectiveAddress))
          )
        )
      )
    ]);
}

