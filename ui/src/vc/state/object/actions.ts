import { CommitObject } from '../../types';
import { adapters, selectVersionControl } from '../reducer';
import { getEntry } from '../actions/common.actions';
import { selectObjects } from './selectors';

export function getObjectEntries(objectId: string) {
  return (dispatch, getState) => {
    const commitObject: CommitObject = adapters.object.selectById(objectId)(
      selectObjects(selectVersionControl(getState()))
    );
    const entriesAddresses = commitObject.links.map(link => link.address);
    entriesAddresses.push(commitObject.data);

    return Promise.all(
      entriesAddresses.map(address => dispatch(getEntry.create({ address })))
    );
  };
}
