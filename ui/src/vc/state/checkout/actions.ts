import { getCachedEntry } from '../actions/cached.actions';
import { EntryResult } from '../../types';
import { getContextContent, getContextAndContent } from '../context/actions';
import { getBranchContent, getBranchAndContent } from '../branch/actions';
import { getCommitContent } from '../commit/actions';

export function getCheckoutAndContent(checkoutId: string) {
  return dispatch =>
    dispatch(getCheckout(checkoutId)).then((entryResult: EntryResult) => {
      switch (entryResult.type) {
        case 'context':
          return dispatch(getContextContent(checkoutId));
        case 'branch':
          return Promise.all([
            dispatch(getContextAndContent(entryResult.entry.context_address)),
            dispatch(getBranchAndContent(checkoutId))
          ]);
        case 'commit':
          return Promise.all([
            dispatch(getContextAndContent(entryResult.entry.context_address)),
            dispatch(getCommitContent(checkoutId))
          ]);
        default:
          break;
      }
    });
}

/**
 * Gets the entry with the address checkoutId whether it's a context, branch or commit
 * @param checkoutId the address of the checkout object
 */
export function getCheckout(checkoutId: string) {
  return dispatch =>
    dispatch(getCachedEntry(checkoutId, ['context', 'branch', 'commit']));
}
