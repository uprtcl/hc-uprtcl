import { LitElement, html, customElement, property, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin.js';

import { store, RootState } from '../../store';
import { createDocument, saveDocument } from '../state/actions';

import './edit-document';
import '../../vc/components/context-container';
import '../../vc/components/created-contexts';
import { selectDocument } from '../state/reducer';
import { Document } from '../types';


@customElement('my-documents')
export class MyDocuments extends connect(store)(LitElement) {
  @property({ type: String })
  selectedContextId: string;

  @property({ type: String })
  newDocumentName: string = '';
  @property({ type: Object })
  selectedDocument: Document;

  @property({ type: Object })
  savingDocument = false;

  selectedBranchId: string;

  getStyles() {
    return css`
      .row {
        display: flex;
        flex-direction: row;
      }
      .column {
        display: flex;
        flex-direction: column;
      }
    `;
  }

  render() {
    return html`
      <style>
        ${this.getStyles()}
      </style>

      <div class="row" style="flex: 1; margin: 12px;">
        <div class="column">
          <h1>My documents</h1>
          <div class="row">
            <input @keyup="${e => (this.newDocumentName = e.target.value)}" />
            <button
              @click="${this.addNewDocument}"
              ?disabled=${this.newDocumentName.length === 0}
            >
              Add new document
            </button>
          </div>

          <created-contexts
            style="margin: 12px;"
            @context-selected=${e =>
              (this.selectedContextId = e.detail.contextId)}
          ></created-contexts>
        </div>

        <div class="column" style="flex: 1; margin: 20px;">
          ${this.selectedContextId &&
            html`
              <context-container
                .contextId=${this.selectedContextId}
                @branch-selected=${e =>
                  (this.selectedBranchId = e.detail.branchId)}
                @entry-selected=${e => this.selectDocument(e.detail.entryId)}
              >
                ${this.selectedDocument
                  ? html`
                      ${this.savingDocument
                        ? html`
                            <span>Saving document...</span>
                          `
                        : html``}
                      <edit-document
                        .document=${this.selectedDocument}
                        @save-document=${this.saveDocument}
                      ></edit-document>
                    `
                  : html`
                      <span>Loading content...</span>
                    `}
              </context-container>
            `}
        </div>
      </div>
    `;
  }

  selectDocument(documentId: string) {
    this.selectedDocument = selectDocument(documentId)(<RootState>(
      store.getState()
    ));
  }

  addNewDocument() {
    store.dispatch(
      createDocument.create({ title: this.newDocumentName, content: '' })
    );
  }

  saveDocument(saveEvent) {
    this.savingDocument = true;
    store
      .dispatch(
        saveDocument.create({
          branch_address: this.selectedBranchId,
          title: saveEvent.detail.title,
          content: saveEvent.detail.content
        })
      )
      .then(() => (this.savingDocument = false));
  }
}
