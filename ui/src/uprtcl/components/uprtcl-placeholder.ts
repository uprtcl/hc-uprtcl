import { LitElement, html, customElement, property } from 'lit-element';

import { store, RootState } from '../../store';
import { Commit } from '../types';
import { connect } from 'pwa-helpers/connect-mixin';
import { createPerspectiveAndContent } from '../state/perspective/actions';

@customElement('uprtcl-placholder')
export class UprtclPlaceholder extends connect(store)(LitElement) {
  render() {
    return html`
      <slot
        @commit-content=${e => this.createContent(e.target.dataLink)}
      ></slot>
    `;
  }

  createContent(dataLink: string) {
    store.dispatch(
      createPerspectiveAndContent(
        { creatorId: '', nonce: 0, timestamp: Date.now() },
        'master',
        {
          creatorId: '',
          timestamp: Date.now(),
          dataLink: dataLink,
          message: 'hi',
          parentsLinks: []
        }
      )
    );
  }
}
