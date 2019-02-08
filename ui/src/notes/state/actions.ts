import { createHolochainAsyncAction } from '@holochain/hc-redux-middleware/build/main';
import { Note } from '../types';

export interface AddressMessage {
  address: string;
}

export const createNote = createHolochainAsyncAction<
  { title: string; content: string },
  AddressMessage
>('test-instance', 'notes', 'create_note');

export const getNote = createHolochainAsyncAction<AddressMessage, Note>(
  'test-instance',
  'notes',
  'get_note'
);

export const getMyNotes = createHolochainAsyncAction<{}, Note[]>(
  'test-instance',
  'notes',
  'get_my_notes'
);
