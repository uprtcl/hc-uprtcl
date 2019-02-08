import { LitElement, html, customElement } from 'lit-element';

import './branch-selector';
import './note-component';

@customElement('app-shell')
export class Shell extends LitElement {
  render() {
    return html`
      <branch-selector></branch-selector>
      <note-component></note-component>
    `;
  }
}
