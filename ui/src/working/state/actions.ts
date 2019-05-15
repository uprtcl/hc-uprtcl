import { workingHolochain } from './reducer';
import { asyncAction } from '../../uprtcl/state/common/actions';
import { Working } from '../types';

export const GET_WORKING = asyncAction<{ perspectiveId: string }, Working>(
  'GET_WORKING'
);

export function getWorking(perspectiveId: string) {
  return dispatch =>
    workingHolochain
      .getWorking(perspectiveId)
      .then(result => dispatch(GET_WORKING.success(result)));
}

export const SET_WORKING = asyncAction<{ working: Working }, void>(
  'SET_WORKING'
);

export function setWorking(working: Working) {
  return dispatch =>
    workingHolochain
      .setWorking(working)
      .then(result => dispatch(SET_WORKING.success(result)));
}
