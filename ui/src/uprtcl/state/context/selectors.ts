import { UprtclState } from '../reducer';

export const selectContexts = (state: UprtclState) =>
  state.contexts.ids.map(id => state.contexts.entities[id]);

export const selectContextById = (contextId: string) => (state: UprtclState) =>
  state.contexts.entities[contextId];

export const selectRootContextId = (state: UprtclState) => state.rootContextId;

export const selectContextPerspectives = (contextId: string) => (
  state: UprtclState
) =>
  state.perspectives.ids
    .map(id => state.perspectives.entities[id])
    .filter(perspective => perspective.context_address === contextId);

export const selectDefaultPerspectiveId = (contextId: string) => (
  state: UprtclState
) => {
  const perspectives = selectContextPerspectives(contextId)(state);
  return perspectives.length > 0 ? perspectives[0].id : null;
};
