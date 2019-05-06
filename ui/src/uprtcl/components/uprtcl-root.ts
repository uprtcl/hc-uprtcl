import { LitElement, html, customElement, property } from 'lit-element';
import { Context } from '../types';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from '../../store';

import './uprtcl-context';
import { getRootContext } from '../state/context/actions';
import { selectUprtcl } from '../state/reducer';
import { selectRootContextId } from '../state/context/selectors';

@customElement('uprtcl-root')
export class UprtclRoot extends connect(store)(LitElement) {
  @property()
  private rootContextId: string;

  @property()
  private loading: boolean = true;

  render() {
    return html`
      ${this.loading
        ? html`
            Loading...
          `
        : html`
            <uprtcl-context .cid=${this.rootContextId}></uprtcl-context>
          `}
    `;
  }

  firstUpdated() {
    store.dispatch(getRootContext.create({})).then(() => {
      this.loading = false;
    });
  }

  stateChanged(state: RootState) {
    this.rootContextId = selectRootContextId(selectUprtcl(state));
  }
}
