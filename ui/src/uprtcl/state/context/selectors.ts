import { UprtclState } from '../reducer';

export const selectContexts = (state: UprtclState) =>
  state.context.ids.map(id => state.context.entities[id]);

export const selectContextById = (contextId: string) => (state: UprtclState) =>
  state.context.entities[contextId];

export const selectRootContextId = (state: UprtclState) => state.rootContextId;

export const selectContextPerspectives = (contextId: string) => (
  state: UprtclState
) =>
  state.perspective.ids
    .map(id => state.perspective.entities[id])
    .filter(perspective => perspective.context_address === contextId);

export const selectDefaultPerspectiveId = (contextId: string) => (
  state: UprtclState
) => {
  const perspectives = selectContextPerspectives(contextId)(state);
  return perspectives.length > 0 ? perspectives[0].id : null;
};
