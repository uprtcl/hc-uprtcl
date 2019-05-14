import { connect } from 'pwa-helpers/connect-mixin';
import { BaseLens } from './base-lens';
import { Store } from 'redux';

/** From the id of the content to render and the viewer id */
export const ReduxLens = (store: Store) =>
  class extends connect(store)(BaseLens) {
    constructor() {
      super();
      this.loading = true;
    }

    getLoadAction() {
      return null;
    }

    loadContent() {
      this.loading = true;
      store.dispatch(this.getLoadAction()).then(() => {
        this.loading = false;
        this.stateChanged(store.getState());
      });
    }
  };
