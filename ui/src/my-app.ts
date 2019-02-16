import { LitElement, html, customElement } from 'lit-element';

import './documents/components/my-documents';

@customElement('my-app')
export class MyApp extends LitElement {
  render() {
    return html`
      <my-documents></my-documents>
    `;
  }
}
