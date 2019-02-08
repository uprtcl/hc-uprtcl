import { getType } from 'typesafe-actions';
import { AnyAction } from 'redux';
import { createNote } from './actions';
import { Note } from '../types';

export interface NotesState {
  notes: Array<Note>;
}

const initialState: NotesState = {
  notes: []
};

export function notesReducer(state = initialState, action: AnyAction) {
  switch (action.type) {
    case getType(createNote.success):
      // The type checker now knows that action.payload has type
      // set in the definition using the generic
      // You literally cant go wrong!
      return state;
    default:
      return state;
  }
}
