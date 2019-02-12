import { createHolochainAsyncAction } from '@holochain/hc-redux-middleware';
import { Document } from '../types';
import { createContext } from '../../vc/state/actions';

export interface AddressMessage {
  address: string;
}

export const createDocument = createHolochainAsyncAction<
  { title: string; content: string },
  string
>('test-instance', 'documents', 'create_document');

export const getDocument = createHolochainAsyncAction<AddressMessage, Document>(
  'test-instance',
  'documents',
  'get_document'
);

export const getMyDocuments = createHolochainAsyncAction<any, any>(
  'test-instance',
  'documents',
  'get_my_documents'
);
