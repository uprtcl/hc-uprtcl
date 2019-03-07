import { VersionControlState, adapters } from '../reducer';
import { selectExistingEntry } from '../selectors/common';
import { EntryResult, CommitObject } from '../../types';
import { selectContextBranches } from '../context/selectors';
import { selectObjectFromBranch } from '../branch/selectors';
import { selectObjectFromCommit } from '../commit/selectors';

export const selectCheckoutById = (checkoutId: string) => (
  state: VersionControlState
) =>
  selectExistingEntry(checkoutId, ['context', 'branch', 'commit'], adapters)(
    state
  );

export const selectObjectFromCheckout = (checkoutId: string) => (
  state: VersionControlState
) => {
  const existingEntry: EntryResult = selectCheckoutById(checkoutId)(state);
  let object: CommitObject;
  switch (existingEntry.type) {
    case 'context':
      const branches = selectContextBranches(existingEntry.entry.id)(state);
      object =
        branches.length > 0
          ? selectObjectFromBranch(branches[0].id)(state)
          : null;
      break;
    case 'branch':
      object = selectObjectFromBranch(existingEntry.entry.id)(state);
      break;
    case 'commit':
      object = selectObjectFromCommit(existingEntry.entry.id)(state);
      break;
    default:
      return null;
  }
  return object;
};

export const selectContextIdFromCheckout = (checkoutId: string) => (
  state: VersionControlState
) => {
  const existingEntry: EntryResult = selectCheckoutById(checkoutId)(state);
  switch (existingEntry.type) {
    case 'context':
      return existingEntry.entry.id;
    case 'branch':
    case 'commit':
      return existingEntry.entry.context_address;
  }
  return null;
};

export const selectEntryIdFromCheckout = (checkoutId: string) => (
  state: VersionControlState
) => {
  const object = selectObjectFromCheckout(checkoutId)(state);
  return object ? object.data : null;
};
