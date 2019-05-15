import { EntityState, createEntityAdapter } from '../../utils/entity';
import { Working } from '../types';
import { RootState } from '../../store';
import { AnyAction } from 'redux';
import { GET_WORKING } from './actions';
import { WorkingHolochain } from '../services/working.holochain';

export interface WorkingState {
  working: EntityState<Working>;
}

export const workingAdapter = createEntityAdapter<Working>(
  (working: Working) => working.perspectiveId
);

const initialState: WorkingState = {
  working: workingAdapter.getInitialState()
};

export function workingReducer(state = initialState, action: AnyAction) {
  switch (action.type) {
    case GET_WORKING.successType:
      return {
        ...state,
        working: workingAdapter.upsertOne(action.payload, state.working)
      };
    default:
      return state;
  }
}

export const selectWorking = (state: RootState) => state.working;

export const selectWorkingByPerspectiveId = (perspectiveId: string) => (
  working: WorkingState
) => workingAdapter.selectById(perspectiveId)(working.working);

export const workingHolochain = new WorkingHolochain();
