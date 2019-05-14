import { EntityState, createEntityAdapter } from '../../utils/entity';
import { DocumentNode } from '../types';
import { RootState } from '../../store';
import { AnyAction } from 'redux';
import { Resolver } from '../../services/resolver';
import { DocumentsService } from '../services/documents.service';
import { HolochainDocuments } from '../services/holochain.documents';
import { GET_DOCUMENT_NODE } from './actions';

export interface DocumentsState {
  documentNodes: EntityState<DocumentNode>;
}

export const documentsAdapter = createEntityAdapter<DocumentNode>();

const initialState: DocumentsState = {
  documentNodes: documentsAdapter.getInitialState()
};

export function documentsReducer(state = initialState, action: AnyAction) {
  switch (action.type) {
    case GET_DOCUMENT_NODE.successType:
      return {
        ...state,
        documentNodes: documentsAdapter.upsertOne(
          action.payload,
          state.documentNodes
        )
      };
    default:
      return state;
  }
}

export const selectDocuments = (state: RootState) => state.documents;

export const selectDocumentNode = (nodeId: string) => (
  documents: DocumentsState
) => documentsAdapter.selectById(nodeId)(documents.documentNodes);

export const documentsResolver = new Resolver<DocumentsService>({
  holochain: {
    'test-instance': new HolochainDocuments()
  }
});

export const documentsHolochain = documentsResolver.getResolver(
  'holochain',
  'test-instance'
);
