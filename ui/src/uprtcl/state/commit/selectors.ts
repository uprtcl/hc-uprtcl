import { UprtclState } from '../reducer';

export const selectCommitById = (commitId: string) => (
  state: UprtclState
) => state.commits.entities[commitId];
