import { LitElement, html, customElement, property } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store, RootState } from '../../store';
import { getMyDocuments, createDocument } from '../state/actions';
import { Document } from '../types';

import './document-list';
import './edit-document';
import { selectMyDocuments } from '../state/reducer';

@customElement('my-documents')
export class MyDocuments extends connect(store)(LitElement) {
  @property({ type: Object })
  documents: Array<Document> = [];

  @property({ type: String })
  selectedDocumentId: string;

  render() {
    return html`
      <div>
        <button @click="${this.addNewDocument}">Add new document</button>
        <document-list
          documents="${this.documents}"
          @document-selected="${e =>
            (this.selectedDocumentId = e.detail.documentId)}"
        ></document-list>

        <div>
          ${this.selectedDocumentId &&
            html`
              <edit-document
                document="${this.getSelectedDocument()}"
              ></edit-document>
            `}
        </div>
      </div>
    `;
  }

  protected firstUpdated() {
    store.dispatch(getMyDocuments.create({}));
  }

  getSelectedDocument() {
    return this.documents.find(
      document => document.id === this.selectedDocumentId
    );
  }

  stateChanged(state: RootState) {
    this.documents = selectMyDocuments(state);
  }

  addNewDocument() {
    store.dispatch(createDocument.create({ title: '', content: '' }));
  }
}
