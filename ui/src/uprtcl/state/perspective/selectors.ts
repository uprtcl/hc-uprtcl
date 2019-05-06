import { UprtclState, adapters } from '../reducer';
import { selectContextById } from '../context/selectors';

export const selectPerspectiveById = (perspectiveId: string) => (
  state: UprtclState
) => state.perspective.entities[perspectiveId];

export const selectPerspectiveHead = (perspectiveId: string) => (
  state: UprtclState
) =>
  adapters.commit.selectById(selectPerspectiveHeadId(perspectiveId)(state))(
    state.commit
  );

export const selectPerspectiveHeadId = (perspectiveId: string) => (
  state: UprtclState
) => selectPerspectiveById(perspectiveId)(state).head;

export const selectContextFromPerspective = (perspectiveId: string) => (
  state: UprtclState
) =>
  selectContextById(
    selectPerspectiveById(perspectiveId)(state).context_address
  )(state);
