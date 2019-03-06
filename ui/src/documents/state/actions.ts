import { createHolochainAsyncAction } from '@holochain/hc-redux-middleware';
import { selectDocuments } from './reducer';
import { getCachedEntry } from '../../vc/state/actions/cached.actions';
import { createContextAndCommit } from '../../vc/state/context/actions';
import { createCommit } from '../../vc/state/commit/actions';
import { Link } from '../../vc/types';

export interface AddressMessage {
  address: string;
}

export function getDocument(documentAddress: string) {
  return dispatch =>
    dispatch(getCachedEntry(documentAddress, ['documents'], selectDocuments));
}

export const saveDocument = createHolochainAsyncAction<
  { title: string; content: string },
  string
>('test-instance', 'documents', 'save_document');

export function createDocument(title: string, content: string) {
  return dispatch =>
    dispatch(saveDocument.create({ title, content })).then(address =>
      dispatch(
        createContextAndCommit.create({
          name: title,
          message: 'first commit',
          content: {
            id: null,
            data: address,
            links: []
          }
        })
      )
    );
}

export function saveDocumentAndCommit(
  branchId: string,
  commitMessage: string,
  title: string,
  content: string,
  links: Link[]
) {
  return dispatch =>
    dispatch(saveDocument.create({ title, content })).then(address =>
      createCommit.create({
        branch_address: branchId,
        message: commitMessage,
        content: {
          id: null,
          data: address,
          links
        }
      })
    );
}
