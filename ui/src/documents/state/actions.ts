import { createHolochainAsyncAction } from '@holochain/hc-redux-middleware';
import { Document } from '../types';
import {
  getCreatedContexts,
  getCreatedContextsAndContents
} from '../../vc/state/actions';
import { Store } from 'redux';
import {
  selectCurrentObjects,
  selectVersionControl
} from '../../vc/state/selectors';

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

export const saveDocument = createHolochainAsyncAction<
  { branch_address: string; title: string; content: string },
  string
>('test-instance', 'documents', 'save_document');

export function getMyDocuments(store: Store) {
  getCreatedContextsAndContents(store);
  /*
  .then(() =>
     selectCurrentObjects(selectVersionControl(store.getState())).map(object =>
      store.dispatch(getDocument.create({ address: object.data }))
    )
    );
*/
}
