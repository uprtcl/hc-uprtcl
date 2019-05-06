import { createHolochainZomeCallAsyncAction } from '@holochain/hc-redux-middleware';
import { INSTANCE_NAME, ZOME_NAME, getCachedEntry } from '../common/actions';
import { Address } from '../../../folders/types';
import { setPerspectiveHead } from '../perspective/actions';

export const createCommit = createHolochainZomeCallAsyncAction<
  { perspective_address: string; message: string; content_address: Address },
  string
>(INSTANCE_NAME, ZOME_NAME, 'create_commit');

export function createCommitInPerspective(
  perspectiveAddress: string,
  message: string,
  contentAddress: Address
) {
  return dispatch =>
    dispatch(
      createCommit.create({
        perspective_address: perspectiveAddress,
        message: message,
        content_address: contentAddress
      })
    ).then(commitAddress =>
      dispatch(setPerspectiveHead(perspectiveAddress, commitAddress))
    );
}

export function getCommitInfo(commitAddress: string) {
  return dispatch =>
    dispatch(getCachedEntry(commitAddress, ['commit'])).then(
      result => result.entry
    );
}
