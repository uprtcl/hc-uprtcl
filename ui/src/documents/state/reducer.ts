import { EntityState, createEntityAdapter } from '../../utils/entity';
import { TextNode } from '../types';
import { RootState } from '../../store';
import { AnyAction } from 'redux';
import { Resolver } from '../../services/resolver';
import { HolochainDocuments } from '../services/holochain.documents';
import { GET_DOCUMENT_NODE } from './actions';
import { DocumentsService } from '../services/document.service';

export interface DocumentsState {
  textNodes: EntityState<TextNode>;
}

export const textAdapter = createEntityAdapter<TextNode>();

const initialState: DocumentsState = {
  textNodes: textAdapter.getInitialState()
};

export function documentsReducer(state = initialState, action: AnyAction) {
  switch (action.type) {
    case GET_DOCUMENT_NODE.successType:
      return {
        ...state,
        textNodes: textAdapter.upsertOne(
          action.payload,
          state.textNodes
        )
      };
    default:
      return state;
  }
}

export const selectDocuments = (state: RootState) => state.documents;

export const selectTextNode = (nodeId: string) => (
  documents: DocumentsState
) => textAdapter.selectById(nodeId)(documents.textNodes);

export const documentsResolver = new Resolver<DocumentsService>({
  holochain: {
    'test-instance': new HolochainDocuments()
  }
});

export const documentsHolochain = documentsResolver.getResolver(
  'holochain',
  'test-instance'
);
