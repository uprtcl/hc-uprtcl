import { createHolochainAsyncAction } from '@holochain/hc-redux-middleware';
import { Note } from '../types';
import { createContext } from '../../vc/state/actions';

export interface AddressMessage {
  address: string;
}

export const createNote = createHolochainAsyncAction<
  { title: string; content: string },
  string
>('test-instance', 'notes', 'create_note');

export const getNote = createHolochainAsyncAction<AddressMessage, Note>(
  'test-instance',
  'notes',
  'get_note'
);

export const getMyNotes = createHolochainAsyncAction<any, any>(
  'test-instance',
  'notes',
  'get_my_notes'
);
