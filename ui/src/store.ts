declare global {
  interface Window {
    process?: Object;
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
  }
}

import {
  createStore,
  compose,
  applyMiddleware,
  combineReducers,
  Reducer,
  StoreEnhancer,
  Action,
  AnyAction
} from 'redux';
import thunk, { ThunkMiddleware } from 'redux-thunk';
import { lazyReducerEnhancer } from 'pwa-helpers/lazy-reducer-enhancer.js';

import { connect } from '@holochain/hc-web-client';
import { holochainMiddleware } from '@holochain/hc-redux-middleware';

import { DocumentsState, documentsReducer } from './documents/state/reducer';
import { versionControlReducer, VersionControlState } from './vc/state/reducer';

// Overall state extends static states and partials lazy states.
export interface RootState {
  documents: DocumentsState;
  versionControl: VersionControlState;
}

// this url should use the same port set up the holochain container
const url = 'ws:localhost:8888';
const hcWc = connect(url);

// Sets up a Chrome extension for time travel debugging.
// See https://github.com/zalmoxisus/redux-devtools-extension for more information.
const devCompose: <Ext0, Ext1, StateExt0, StateExt1>(
  f1: StoreEnhancer<Ext0, StateExt0>,
  f2: StoreEnhancer<Ext1, StateExt1>
) => StoreEnhancer<Ext0 & Ext1, StateExt0 & StateExt1> =
  window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export const store = createStore(
  state => state as Reducer<RootState, Action<any>>,
  devCompose(
    lazyReducerEnhancer(combineReducers),
    applyMiddleware(holochainMiddleware(hcWc), thunk as ThunkMiddleware<
      RootState,
      AnyAction
    >)
  )
);

// Initially loaded reducers.
store.addReducers({
  documents: documentsReducer,
  versionControl: versionControlReducer
});
