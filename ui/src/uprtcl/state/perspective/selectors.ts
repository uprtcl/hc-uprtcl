import { UprtclState, adapters } from '../reducer';
import { selectContextById } from '../context/selectors';

export const selectPerspectiveById = (perspectiveId: string) => (
  state: UprtclState
) => state.perspectives.entities[perspectiveId];

export const selectPerspectiveHead = (perspectiveId: string) => (
  state: UprtclState
) =>
  adapters.commits.selectById(selectPerspectiveHeadId(perspectiveId)(state))(
    state.commits
  );

export const selectPerspectiveHeadId = (perspectiveId: string) => (
  state: UprtclState
) => selectPerspectiveById(perspectiveId)(state).headLink;

export const selectContextFromPerspective = (perspectiveId: string) => (
  state: UprtclState
) =>
  selectContextById(
    selectPerspectiveById(perspectiveId)(state).contextId
  )(state);
