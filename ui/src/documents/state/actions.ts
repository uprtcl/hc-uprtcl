import { createHolochainAsyncAction } from '@holochain/hc-redux-middleware';
import { getCachedEntry } from '../../vc/state/actions';

export interface AddressMessage {
  address: string;
}

export const createDocument = createHolochainAsyncAction<
  { title: string; content: string },
  string
>('test-instance', 'documents', 'create_document');

export function getDocument(documentAddress: string) {
  return dispatch => dispatch(getCachedEntry(documentAddress, 'documents'));
}

export const saveDocument = createHolochainAsyncAction<
  { branch_address: string; title: string; content: string },
  string
>('test-instance', 'documents', 'save_document');
