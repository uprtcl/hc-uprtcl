import { getType } from 'typesafe-actions';
import { AnyAction } from 'redux';
import { Document } from '../types';
import { EntityState, createEntityAdapter } from '../../vc/utils/entity';
import { createSelector } from 'reselect';
import {
  selectVersionControl,
  selectObjectFromBranch
} from '../../vc/state/selectors';
import { RootState } from '../../store';
import { getEntry } from '../../vc/state/actions';
import { parseEntryResult } from '../../vc/utils/utils';
import { VersionControlState } from '../../vc/state/reducer';

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
      return {
        ...state,
        documents: documentsAdapter.upsertOne(
          parseEntryResult(action.payload),
          state.documents
        )
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
