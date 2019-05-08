import { createHolochainZomeCallAsyncAction } from '@holochain/hc-redux-middleware';
import { selectUprtcl, adapters } from '../reducer';
import { EntityAdapter } from '../../../utils/entity';
import { EntryResult } from '../../types';
import { selectExistingEntry } from './selectors';
import { parseEntryResult } from '../../../utils/parse';

export const INSTANCE_NAME = 'test-instance';
export const ZOME_NAME = 'uprtcl';

export interface AddressRequest {
  address: string;
}

export const getEntry = createHolochainZomeCallAsyncAction<
  { address: string },
  any
>(INSTANCE_NAME, ZOME_NAME, 'get_entry');

/**
 * Tries to find the given entry in the given entityTypes, and executes getEntry if it doesn't exist
 * @param entryAddress the address we are looking for
 * @param entityTypes the possible types of entity that the entry can have
 * @param selectState a state selector from the redux's root state, default to selectVersionControl
 */
export function getCachedEntry(
  entryAddress: string,
  entityTypes: string[],
  selectState: (state) => any = selectUprtcl,
  entityAdapters: { [key: string]: EntityAdapter<any> } = adapters
) {
  return (dispatch, getState): Promise<EntryResult> => {
    if (!entryAddress) return Promise.reject();

    const entryResult = selectExistingEntry(
      entryAddress,
      entityTypes,
      entityAdapters
    )(selectState(getState()));
    if (!entryResult) {
      return dispatch(getEntry.create({ address: entryAddress })).then(entry =>
        parseEntryResult(entry)
      );
    } else {
      return Promise.resolve(entryResult);
    }
  };
}
