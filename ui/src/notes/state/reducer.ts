import { getType } from 'typesafe-actions';
import { AnyAction } from 'redux';
import { createNote, getMyNotes } from './actions';
import { Note } from '../types';

export interface NotesState {
  notes: Array<Note>;
}

const initialState: NotesState = {
  notes: []
};

export function notesReducer(state = initialState, action: AnyAction) {
  console.log(action);
  switch (action.type) {
    case getType(getMyNotes.success):
      state.notes = action.payload.map(entry => entry.Ok.App[1]);
      return state;
    default:
      return state;
  }
}
