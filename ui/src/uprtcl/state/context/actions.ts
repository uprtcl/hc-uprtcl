import { createHolochainZomeCallAsyncAction } from '@holochain/hc-redux-middleware';
import { INSTANCE_NAME, ZOME_NAME, getCachedEntry } from '../common/actions';
import { getPerspectiveContent, getPerspectiveInfo } from '../perspective/actions';

/** Holochain actions */

export const createContext = createHolochainZomeCallAsyncAction<
  { name: string },
  string
>(INSTANCE_NAME, ZOME_NAME, 'create_context');

export const createContextAndCommit = createHolochainZomeCallAsyncAction<
  { name: string; message: string; content_address: string },
  string
>(INSTANCE_NAME, ZOME_NAME, 'create_context_and_commit');

export const getCreatedContexts = createHolochainZomeCallAsyncAction<{}, any>(
  INSTANCE_NAME,
  ZOME_NAME,
  'get_created_contexts'
);

export const getAllContexts = createHolochainZomeCallAsyncAction<{}, any>(
  INSTANCE_NAME,
  ZOME_NAME,
  'get_all_contexts'
);

export const getContextPerspectives = createHolochainZomeCallAsyncAction<
  { context_address: string },
  any
>(INSTANCE_NAME, ZOME_NAME, 'get_context_perspectives');

export const getContextHistory = createHolochainZomeCallAsyncAction<
  { context_address: string },
  string
>(INSTANCE_NAME, ZOME_NAME, 'get_context_history');

export const getRootContext = createHolochainZomeCallAsyncAction<{}, string>(
  INSTANCE_NAME,
  ZOME_NAME,
  'get_root_context'
);

/** Helper actions */

export function getContextInfo(contextAddress: string) {
  return dispatch =>
    dispatch(getCachedEntry(contextAddress, ['context'])).then(
      result => result.entry
    );
}

export function getContextContent(contextAddress: string) {
  return dispatch =>
    Promise.all([
      dispatch(getContextInfo(contextAddress)),
      dispatch(
        getContextPerspectives.create({ context_address: contextAddress })
      ).then(addressesResult =>
        Promise.all(
          addressesResult.links.map(({ address: perspectiveAddress }) =>
            dispatch(getPerspectiveInfo(perspectiveAddress))
          )
        )
      )
    ]);
}
