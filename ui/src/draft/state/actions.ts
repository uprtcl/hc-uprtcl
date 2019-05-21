import { draftsHolochain } from './reducer';
import { Draft } from '../types';

export function asyncAction<ParamType, SuccessType>(requestType: string) {
  const create = (payload: ParamType) => ({
    type: requestType,
    payload: payload
  });

  const successType = requestType + '_SUCCESS';
  const success = (payload: SuccessType) => ({
    type: successType,
    payload: payload
  });

  const failureType = requestType + '_FAILURE';
  const failure = payload => ({
    type: failureType,
    payload: payload
  });

  return {
    create: create,
    createType: requestType,
    success: success,
    successType: successType,
    failure: failure,
    failureType: failureType
  };
}

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
