import { documentsHolochain } from './reducer';
import { asyncAction } from '../../uprtcl/state/common/actions';
import { TextNode } from '../types';

export const GET_DOCUMENT_NODE = asyncAction<{ nodeId: string }, TextNode>(
  'GET_DOCUMENT_NODE'
);

export function getTextNode(nodeId: string) {
  return dispatch =>
    documentsHolochain
      .getTextNode(nodeId)
      .then(result => dispatch(GET_DOCUMENT_NODE.success(result)));
}

export const CREATE_DOCUMENT_NODE = asyncAction<{ node: TextNode }, string>(
  'CREATE_DOCUMENT_NODE'
);

export function createTextNode(node: TextNode) {
  return dispatch =>
    documentsHolochain
      .createTextNode(node)
      .then(result => dispatch(CREATE_DOCUMENT_NODE.success(result)));
}
