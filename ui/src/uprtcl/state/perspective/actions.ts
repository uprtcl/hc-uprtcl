import { Perspective } from '../../types';
import { selectPerspectiveHeadId, selectPerspectiveById } from './selectors';
import { selectUprtcl, universalUprtcl } from '../reducer';
import { getContextContent } from '../context/actions';
import { asyncAction } from '../common/actions';
import { getCommit } from '../commit/actions';

/** Main actions */

export const CREATE_PERSPECTIVE = asyncAction<
  { contextId: string; commitId: string; name: string },
  string
>('create_perspective');

export function createPerspective(
  contextId: string,
  commitId: string,
  name: string
) {
  return dispatch =>
    universalUprtcl
      .createPerspective(contextId, commitId, name)
      .then(perspectiveId =>
        dispatch(CREATE_PERSPECTIVE.success(perspectiveId))
      );
}

export const GET_PERSPECTIVE = asyncAction<
  { perspectiveId: string },
  Perspective
>('get_perspective');

export function getPerspective(perspectiveId: string) {
  return dispatch =>
    universalUprtcl
      .getPerspective(perspectiveId)
      .then(perspective => dispatch(GET_PERSPECTIVE.success(perspective)));
}

export const SET_PERSPECTIVE_HEAD = 'SET_PERSPECTIVE_HEAD';

export function setPerspectiveHead(perspectiveId: string, commitId: string) {
  return {
    type: SET_PERSPECTIVE_HEAD,
    payload: {
      perspectiveId,
      commitId
    }
  };
}

/** Helper actions */

/**
 * Gets the perspective head commit's info and contents
 */
export function getPerspectiveContent(perspectiveAddress: string) {
  return (dispatch, getState) =>
    dispatch(getPerspective(perspectiveAddress)).then(() => {
      const perspectiveHead = selectPerspectiveHeadId(perspectiveAddress)(
        selectUprtcl(getState())
      );

      return perspectiveHead
        ? dispatch(getCommit(perspectiveHead))
        : Promise.resolve();
    });
}

/**
 * Gets the perspective, its context and sibling perspectives
 */
export function getPerspectiveContext(perspectiveAddress: string) {
  return (dispatch, getState) =>
    dispatch(getPerspectiveContent(perspectiveAddress)).then(() => {
      const perspective = selectPerspectiveById(perspectiveAddress)(
        selectUprtcl(getState())
      );

      return dispatch(getContextContent(perspective.context_address));
    });
}
