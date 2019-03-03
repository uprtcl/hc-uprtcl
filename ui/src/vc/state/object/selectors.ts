import { VersionControlState } from '../reducer';

export const selectObjects = (state: VersionControlState) => state.object;

export const selectObjectById = (objectId: string) => (
  state: VersionControlState
) => selectObjects(state).entities[objectId];

export const selectEntryFromObject = (objectId: string) => (
  state: VersionControlState
) => selectObjects(state).entities[objectId].data;
