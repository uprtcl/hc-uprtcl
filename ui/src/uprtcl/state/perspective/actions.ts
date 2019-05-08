import { createHolochainZomeCallAsyncAction } from '@holochain/hc-redux-middleware';
import { INSTANCE_NAME, ZOME_NAME, getCachedEntry } from '../common/actions';
import { EntryResult, Perspective } from '../../types';
import { selectPerspectiveHeadId, selectPerspectiveById } from './selectors';
import { selectUprtcl } from '../reducer';
import { getCommitInfo } from '../commit/actions';
import { getContextContent } from '../context/actions';

/** Holochain actions */

export const createPerspective = createHolochainZomeCallAsyncAction<
  { context_address: string; commit_address: string; name: string },
  string
>(INSTANCE_NAME, ZOME_NAME, 'create_perspective');

export const getPerspectiveHead = createHolochainZomeCallAsyncAction<
  { perspective_address: string },
  string
>(INSTANCE_NAME, ZOME_NAME, 'get_perspective_head');

/** Common action */

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

export function getPerspectiveInfo(persectiveAddress: string) {
  return dispatch =>
    dispatch(getCachedEntry(persectiveAddress, ['perspective'])).then(
      (result: EntryResult<Perspective>) => {
        if (!result.entry.head) {
          return dispatch(
            getPerspectiveHead.create({
              perspective_address: persectiveAddress
            })
          )
            .then((commitAddress: string) =>
              dispatch(setPerspectiveHead(persectiveAddress, commitAddress))
            )
        }
        return result.entry;
      }
    );
}

/**
 * Gets the perspective head commit's info and contents
 */
export function getPerspectiveContent(perspectiveAddress: string) {
  return (dispatch, getState) =>
    dispatch(getPerspectiveInfo(perspectiveAddress)).then(() => {
      const perspectiveHead = selectPerspectiveHeadId(perspectiveAddress)(
        selectUprtcl(getState())
      );

      return perspectiveHead
        ? dispatch(getCommitInfo(perspectiveHead))
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
