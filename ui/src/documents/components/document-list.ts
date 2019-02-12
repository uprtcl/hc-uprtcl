import { LitElement, html, customElement, property } from 'lit-element';
import { Document } from '../types';

@customElement('document-list')
export class DocumentList extends LitElement {
  @property({ type: Object })
  public documents: Array<Document> = [];

  render() {
    return html`
      <div>
        ${this.documents.map(
          document => html`
            <button @click="${e => this.documentSelected(document.id)}">
              ${document.title}
            </button>
          `
        )}
      </div>
    `;
  }

  documentSelected(documentId: string) {
    const event = new CustomEvent('document-selected', {
      detail: {
        documentId: documentId
      }
    });
    this.dispatchEvent(event);
  }
}
