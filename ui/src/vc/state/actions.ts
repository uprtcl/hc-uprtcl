import { createHolochainAsyncAction } from '@holochain/hc-redux-middleware';

export interface AddressResponse {
  address: string;
}

export const createContext = createHolochainAsyncAction<any, AddressResponse>(
  'test-instance',
  'vc',
  'create_context'
);
