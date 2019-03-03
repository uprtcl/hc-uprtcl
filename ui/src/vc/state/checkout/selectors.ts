import { VersionControlState } from '../reducer';
import { selectExistingEntry } from '../selectors/common';
import { EntryResult, CommitObject } from '../../types';
import { selectContextBranches } from '../context/selectors';
import { selectObjectFromBranch } from '../branch/selectors';
import { selectObjectFromCommit } from '../commit/selectors';

export const selectCheckoutById = (checkoutId: string) => (
  state: VersionControlState
) => selectExistingEntry(checkoutId, ['context', 'branch', 'commit'])(state);

export const selectEntryIdFromCheckout = (checkoutId: string) => (
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
  console.log(checkoutId);
  console.log(existingEntry);
  console.log(object);
  return object ? object.data : null;
};
