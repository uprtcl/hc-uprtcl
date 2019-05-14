export function asyncAction<ParamType, SuccessType>(requestType: string) {
  const create = (payload: ParamType) => ({
    type: requestType,
    payload: payload
  });

  const successType = requestType + '_SUCCESS';
  const success = (payload: SuccessType) => ({
    type: successType,
    payload: payload
  });

  const failureType = requestType + '_FAILURE';
  const failure = payload => ({
    type: failureType,
    payload: payload
  });

  return {
    create: create,
    createType: requestType,
    success: success,
    successType: successType,
    failure: failure,
    failureType: failureType
  };
}

/**
 * Tries to find the given entry in the given entityTypes, and executes getEntry if it doesn't exist
 * @param entryAddress the address we are looking for
 * @param entityTypes the possible types of entity that the entry can have
 * @param selectState a state selector from the redux's root state, default to selectVersionControl
 */
/* export function getCachedEntry(
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
 */
