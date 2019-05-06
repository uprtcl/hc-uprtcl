import { LitElement, html, customElement, property } from 'lit-element';
import { installRouter } from 'pwa-helpers/router.js';

import './uprtcl/components/uprtcl-root';

@customElement('my-app')
export class MyApp extends LitElement {
  @property()
  checkoutPerspectiveId: string;

  constructor() {
    super();
    installRouter(location => this.handleNavigation(location));
  }

  render() {
    return html`
      ${this.checkoutPerspectiveId
        ? html`
            <uprtcl-perspective
              .cid=${this.checkoutPerspectiveId}
            ></uprtcl-perspective>
          `
        : html`
            <uprtcl-root></uprtcl-root>
          `}
    `;
  }

  handleNavigation(location: Location) {
    this.checkoutPerspectiveId = location.pathname.split('/')[2];
  }
}
