import { EntityState, createEntityAdapter } from '../../utils/entity';
import { Folder } from '../types';
import { RootState } from '../../store';
import { getFolder } from './actions';
import { getType } from 'typesafe-actions';
import { AnyAction } from 'redux';
import { parseEntryResult, parseEntry } from '../../utils/parse';

export interface FoldersState {
  folders: EntityState<Folder>;
}

export const foldersAdapter = createEntityAdapter<Folder>();

const initialState: FoldersState = {
  folders: foldersAdapter.getInitialState()
};

export function foldersReducer(state = initialState, action: AnyAction) {
  switch (action.type) {
    case getType(getFolder.success):
      return {
        ...state,
        folders: foldersAdapter.upsertOne(parseEntryResult(action.payload).entry, state.folders)
      };
    default:
      return state;
  }
}

export const selectFolders = (state: RootState) => state.folders;

export const selectFolder = (folderId: string) => (folders: FoldersState) =>
  foldersAdapter.selectById(folderId)(folders.folders);
