import { asyncAction } from '../common/actions';
import { uprtclResolver } from '../reducer';
import { Commit } from '../../types';
import { setPerspectiveHead } from '../perspective/actions';

export const CREATE_COMMIT = asyncAction<
  { perspectiveId: string; message: string; contentAddress: string },
  string
>('CREATE_COMMIT');

export function createCommit(
  perspectiveAddress: string,
  message: string,
  contentAddress: string
) {
  return dispatch =>
    uprtclResolver
      .getResolver('holochain')
      .createCommit(perspectiveAddress, message, contentAddress)
      .then(commitAddress =>
        dispatch(CREATE_COMMIT.success(commitAddress)).then(() =>
          dispatch(setPerspectiveHead(perspectiveAddress, commitAddress))
        )
      );
}

export const GET_COMMIT = asyncAction<{ commitId: string }, Commit>(
  'GET_COMMIT'
);

export function getCommit(commitId: string) {
  return dispatch =>
    uprtclResolver
      .getCommit(commitId)
      .then(commit => dispatch(GET_COMMIT.success(commit)));
}
