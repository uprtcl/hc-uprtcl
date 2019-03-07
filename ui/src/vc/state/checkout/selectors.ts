import { VersionControlState, adapters } from '../reducer';
import { selectExistingEntry } from '../selectors/common';
import { EntryResult, CommitObject, Branch } from '../../types';
import {
  selectContextBranches,
  selectDefaultBranch
} from '../context/selectors';
import { selectObjectFromBranch } from '../branch/selectors';
import {
  selectObjectFromCommit,
  selectBranchFromCommit
} from '../commit/selectors';

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
      const branch = selectDefaultBranch(existingEntry.entry.id)(state);
      return selectObjectFromBranch(branch.id)(state);
    case 'branch':
      return selectObjectFromBranch(existingEntry.entry.id)(state);
    case 'commit':
      return selectObjectFromCommit(existingEntry.entry.id)(state);
    default:
      return null;
  }
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

export const selectBranchIdFromCheckout = (checkoutId: string) => (
  state: VersionControlState
) => {
  const existingEntry: EntryResult = selectCheckoutById(checkoutId)(state);
  let branch: Branch;
  switch (existingEntry.type) {
    case 'context':
      branch = selectDefaultBranch(existingEntry.entry.id)(state);
      break;
    case 'branch':
      branch = existingEntry.entry;
      break;
    case 'commit':
      branch = selectBranchFromCommit(existingEntry.entry.id)(state);
      break;
  }
  return branch ? branch.id : null;
};

export const selectEntryIdFromCheckout = (checkoutId: string) => (
  state: VersionControlState
) => {
  const object = selectObjectFromCheckout(checkoutId)(state);
  return object ? object.data : null;
};
