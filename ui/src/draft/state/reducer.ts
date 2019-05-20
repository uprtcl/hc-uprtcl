import { EntityState, createEntityAdapter } from '../../utils/entity';
import { Draft } from '../types';
import { RootState } from '../../store';
import { AnyAction } from 'redux';
import {  GET_DRAFT } from './actions';
import { DraftsHolochain } from '../services/drafts.holochain';

export interface DraftsState {
  drafts: EntityState<Draft>;
}

export const draftAdapter = createEntityAdapter<Draft>(
  (draft: Draft) => draft.perspectiveId
);

const initialState: DraftsState = {
  drafts: draftAdapter.getInitialState()
};

export function draftReducer(state = initialState, action: AnyAction) {
  switch (action.type) {
    case GET_DRAFT.successType:
      return {
        ...state,
        drafts: draftAdapter.upsertOne(action.payload, state.drafts)
      };
    default:
      return state;
  }
}

export const selectDrafts = (state: RootState) => state.drafts;

export const selectDraftByPerspectiveId = (perspectiveId: string) => (
  drafts: DraftsState
) => draftAdapter.selectById(perspectiveId)(drafts.drafts);

export const draftsHolochain = new DraftsHolochain();
