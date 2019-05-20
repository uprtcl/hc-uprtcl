import { draftsHolochain } from './reducer';
import { asyncAction } from '../../uprtcl/state/common/actions';
import { Draft } from '../types';

export const GET_DRAFT = asyncAction<{ perspectiveId: string }, Draft>(
  'GET_DRAFT'
);

export function getDraft(perspectiveId: string) {
  return dispatch =>
    draftsHolochain
      .getDraft(perspectiveId)
      .then(result => dispatch(GET_DRAFT.success(result)));
}

export const SET_DRAFT = asyncAction<{ draft: Draft }, void>('SET_DRAFT');

export function setWorking(draft: Draft) {
  return dispatch =>
    draftsHolochain
      .setDraft(draft)
      .then(result => dispatch(SET_DRAFT.success(result)));
}
