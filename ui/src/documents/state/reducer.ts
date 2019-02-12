import { getType } from 'typesafe-actions';
import { AnyAction } from 'redux';
import { getMyDocuments } from './actions';
import { Document } from '../types';
import { EntityState, createEntityAdapter } from '../../vc/utils/entity';
import { createSelector } from 'reselect';
import {
  selectVersionControl,
  VersionControlState,
  selectContexts,
  selectCurrentObjects
} from '../../vc/state/reducer';
import { Object } from '../../vc/types';
import { RootState } from '../../store';

export interface DocumentsState {
  documents: EntityState<Document>;
}

const documentsAdapter = createEntityAdapter<Document>();

const initialState: DocumentsState = {
  documents: documentsAdapter.getInitialState()
};

export function documentsReducer(state = initialState, action: AnyAction) {
  console.log(action);
  switch (action.type) {
    case getType(getMyDocuments.success):
      return {
        ...state,
        documents: documentsAdapter.insertMany(action.payload, state.documents)
      };
    default:
      return state;
  }
}

export const selectDocuments = (state: RootState) => state.documents;

export const selectMyDocuments = createSelector(
  createSelector(
    selectVersionControl,
    selectCurrentObjects
  ),
  selectDocuments,
  (objects: Object[], documents: DocumentsState) =>
    objects.map(object => documentsAdapter.selectById(object.data)(documents.documents))
);
