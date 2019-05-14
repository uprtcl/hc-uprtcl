import { documentsHolochain } from './reducer';
import { asyncAction } from '../../uprtcl/state/common/actions';
import { DocumentNode } from '../types';

export const GET_DOCUMENT_NODE = asyncAction<{ nodeId: string }, DocumentNode>(
  'GET_DOCUMENT_NODE'
);

export function getDocumentNode(nodeId: string) {
  return dispatch =>
    documentsHolochain
      .getDocumentNode(nodeId)
      .then(result => dispatch(GET_DOCUMENT_NODE.success(result)));
}

export const CREATE_DOCUMENT_NODE = asyncAction<{ node: DocumentNode }, string>(
  'CREATE_DOCUMENT_NODE'
);

export function createDocumentNode(node: DocumentNode) {
  return dispatch =>
    documentsHolochain
      .createDocumentNode(node)
      .then(result => dispatch(CREATE_DOCUMENT_NODE.success(result)));
}
