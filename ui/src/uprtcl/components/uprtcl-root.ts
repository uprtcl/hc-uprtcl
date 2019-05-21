import { LitElement, html, customElement, property } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from '../../store';

import './uprtcl-context';
import { getRootPerspective } from '../state/context/actions';
import { selectUprtcl } from '../state/reducer';
import { selectRootPerspectiveId } from '../state/context/selectors';

@customElement('uprtcl-root')
export class UprtclRoot extends connect(store)(LitElement) {
  @property()
  private rootPerspectiveId: string;

  @property()
  private loading: boolean = true;

  render() {
    return html`
      ${this.loading
        ? html`
            Loading...
          `
        : html`
            <uprtcl-perspective
              .perspectiveId=${this.rootPerspectiveId}
            ></uprtcl-perspective>
          `}
    `;
  }

  firstUpdated() {
    this.loading = true;
    store.dispatch(getRootPerspective()).then(() => {
      this.loading = false;
    });
  }

  stateChanged(state: RootState) {
    this.rootPerspectiveId = selectRootPerspectiveId(selectUprtcl(state));
  }
}
