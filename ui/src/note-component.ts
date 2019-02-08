import { LitElement, html, customElement } from 'lit-element';

@customElement('note-component')
export class NoteComponent extends LitElement {

  render() {
    return html`
    <span>Im a note</span>
    `;
  }
}
