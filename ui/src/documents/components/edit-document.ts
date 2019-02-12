import { LitElement, html, customElement, property } from 'lit-element';
import { Document } from '../types';

@customElement('edit-document')
export class EditDocument extends LitElement {
  @property({ type: Object })
  public document: Document;

  render() {
    return html`
      <div>
        <h3>${this.document.title}</h3>
        <span>${this.document.content}</span>
        <button @click="${this.saveDocument}">Save Changes</button>
      </div>
    `;
  }

  saveDocument() {}
}
