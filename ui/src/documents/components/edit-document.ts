import { LitElement, html, customElement, property } from 'lit-element';
import { Document } from '../types';

@customElement('edit-document')
export class EditDocument extends LitElement {
  @property({ type: Object })
  public document: Document;

  documentContent: string;

  render() {
    return html`
      <div>
        <h3>${this.document.title}</h3>
        <textarea
          .value=${this.document.content}
          @keyup="${e => (this.documentContent = e.target.value)}"
        ></textarea>
        <button
          @click="${this.saveDocument}"
          ?disabled=${this.documentContent === null}
        >
          Save Changes
        </button>
      </div>
    `;
  }

  saveDocument(event) {
    const saveDocument = new CustomEvent('save-document', {
      detail: {
        documentId: this.document.id,
        title: this.document.title,
        content: this.documentContent
      }
    });

    this.dispatchEvent(saveDocument);
  }
}
