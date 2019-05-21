import {
  LitElement,
  html,
  customElement,
  property,
  PropertyValues
} from 'lit-element';
import { installRouter } from 'pwa-helpers/router.js';

import './uprtcl/components/uprtcl-root';
import { Perspective } from './uprtcl/types';
import { UprtclHolochain } from './uprtcl/services/uprtcl.holochain';

import './documents/components/text-node';

@customElement('my-app')
export class MyApp extends LitElement {
  @property()
  private checkoutPerspectiveId: string;

  @property()
  private loading: boolean = true;

  uprtclHolochain = new UprtclHolochain();

  constructor() {
    super();
    installRouter(location => this.handleNavigation(location));
  }

  render() {
    return html`
      ${this.loading
        ? html`
            Loading...
          `
        : html`
            <uprtcl-perspective .perspectiveId=${this.checkoutPerspectiveId}>
              <text-node></text-node>
            </uprtcl-perspective>
          `}
    `;
  }

  firstUpdated() {
    if (!this.checkoutPerspectiveId) {
      this.uprtclHolochain.getRootPerspective().then(perspective => {
        this.checkoutPerspectiveId = perspective.id;
        this.loading = false;
      });
    }
  }

  handleNavigation(location: Location) {
    this.checkoutPerspectiveId = location.pathname.split('/')[2];
  }
}
