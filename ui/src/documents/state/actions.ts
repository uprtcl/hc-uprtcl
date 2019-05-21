import { documentsHolochain } from './reducer';
import { TextNode } from '../types';

export function asyncAction<ParamType, SuccessType>(requestType: string) {
  const create = (payload: ParamType) => ({
    type: requestType,
    payload: payload
  });

  const successType = requestType + '_SUCCESS';
  const success = (payload: SuccessType) => ({
    type: successType,
    payload: payload
  });

  const failureType = requestType + '_FAILURE';
  const failure = payload => ({
    type: failureType,
    payload: payload
  });

  return {
    create: create,
    createType: requestType,
    success: success,
    successType: successType,
    failure: failure,
    failureType: failureType
  };
}

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
