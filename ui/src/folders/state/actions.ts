import { createHolochainZomeCallAsyncAction } from '@holochain/hc-redux-middleware';
import { Folder } from '../types';

export const INSTANCE_NAME = 'test-instance';
export const ZOME_NAME = 'folder';

export const getFolder = createHolochainZomeCallAsyncAction<
  { address: string },
  string
>(INSTANCE_NAME, ZOME_NAME, 'get_folder');

export const createFolder = createHolochainZomeCallAsyncAction<
  { folder: Folder },
  string
>(INSTANCE_NAME, ZOME_NAME, 'create_folder');

export const updateFolderAction = createHolochainZomeCallAsyncAction<
  { perspective_address: string; folder: Folder },
  string
>(INSTANCE_NAME, ZOME_NAME, 'update_folder');

export function updateFolder(perspectiveAddress: string, folder: Folder) {
  return dispatch =>
    dispatch(
      updateFolderAction.create({
        perspective_address: perspectiveAddress,
        folder: folder
      })
    ).then(address => getFolder.create({ address }));
}
