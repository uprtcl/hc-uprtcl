import { getCachedEntry } from '../actions/cached.actions';
import { EntryResult } from '../../types';
import { getContextContent, getContextAndContent } from '../context/actions';
import { getBranchAndContent } from '../branch/actions';
import { getCommitContent } from '../commit/actions';

export function getCheckoutAndContent(checkoutId: string) {
  return dispatch =>
    dispatch(getCheckout(checkoutId)).then((entryResult: EntryResult) => {
      switch (entryResult.type) {
        case 'context':
          return dispatch(getContextContent(checkoutId));
        case 'branch':
          return dispatch(getBranchAndContent(checkoutId));
        case 'commit':
          return dispatch(getCommitContent(checkoutId));
        default:
          break;
      }
    });
}

export function getCheckoutAndContext(checkoutId: string) {
  return dispatch =>
    dispatch(getCheckout(checkoutId)).then((entryResult: EntryResult) => {
      switch (entryResult.type) {
        case 'context':
          return dispatch(getContextContent(checkoutId));
        case 'branch':
          return dispatch(
            getContextAndContent(entryResult.entry.context_address)
          );
        case 'commit':
          return dispatch(
            getContextAndContent(entryResult.entry.context_address)
          );
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
