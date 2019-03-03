import { getType } from 'typesafe-actions';
import { AnyAction } from 'redux';
import { Document } from '../types';
import { EntityState, createEntityAdapter } from '../../vc/utils/entity';
import { createSelector } from 'reselect';
import { RootState } from '../../store';
import { getEntry } from '../../vc/state/actions/common.actions';
import { parseEntryResult } from '../../vc/utils/utils';

export interface DocumentsState {
  documents: EntityState<Document>;
}

const documentsAdapter = createEntityAdapter<Document>();

const initialState: DocumentsState = {
  documents: documentsAdapter.getInitialState()
};

export function documentsReducer(state = initialState, action: AnyAction) {
  switch (action.type) {
    case getType(getEntry.success):
      const result = parseEntryResult(action.payload);
      if (result.type !== 'document') return state;
      return {
        ...state,
        documents: documentsAdapter.upsertOne(result.entry, state.documents)
      };
    default:
      return state;
  }
}

export const selectDocuments = (state: RootState) => state.documents;

export const selectDocument = (documentId: string) =>
  createSelector(
    selectDocuments,
    (documents: DocumentsState) =>
      documentsAdapter.selectById(documentId)(documents.documents)
  );
