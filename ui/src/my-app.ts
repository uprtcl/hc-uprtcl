import { LitElement, html, customElement } from 'lit-element';

declare var Cids;

import './uprtcl/components/uprtcl-root';

@customElement('my-app')
export class MyApp extends LitElement {
  render() {
    return html`
      <uprtcl-root></uprtcl-root>
    `;
  }
}
