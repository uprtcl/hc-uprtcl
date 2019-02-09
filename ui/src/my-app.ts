import { LitElement, html, customElement } from 'lit-element';

import './notes/components/create-note';
import './notes/components/note-list';

@customElement('my-app')
export class MyApp extends LitElement {
  render() {
    return html`
      <div>
        <note-list></note-list>
        <create-note></create-note>
      </div>
    `;
  }
}
