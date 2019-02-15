import { LitElement, html, customElement, property } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store, RootState } from '../../store';
import { createDocument, saveDocument } from '../state/actions';

import './edit-document';
import '../../vc/components/branch-selector';
import '../../vc/components/created-contexts';
import { selectDocument } from '../state/reducer';
import { getBranchAndContents } from '../../vc/state/actions';
import { Document } from '../types';

@customElement('my-documents')
export class MyDocuments extends connect(store)(LitElement) {
  @property({ type: String })
  selectedContextId: string;
  @property({ type: String })
  selectedBranchId: string;

  @property({ type: String })
  newDocumentName: string = '';
  @property({ type: Object })
  selectedDocument: Document;

  render() {
    return html`
      <div>
        <div>
          <input @keyup="${e => (this.newDocumentName = e.target.value)}" />
          <button
            @click="${this.addNewDocument}"
            ?disabled=${this.newDocumentName.length === 0}
          >
            Add new document
          </button>
        </div>

        <created-contexts
          @context-selected=${e =>
            (this.selectedContextId = e.detail.contextId)}
        ></created-contexts>

        <div>
          ${this.selectedContextId &&
            html`
              <branch-selector
                .contextId=${this.selectedContextId}
                @branch-selected=${e => this.selectBranch(e.detail.branchId)}
              ></branch-selector>

              ${this.selectedBranchId &&
                (this.selectedDocument
                  ? html`
                      <edit-document
                        .document=${this.selectedDocument}
                        @save-document=${this.saveDocument}
                      ></edit-document>
                    `
                  : html`
                      <span>Loading content...</span>
                    `)}
            `}
        </div>
      </div>
    `;
  }

  getSelectedDocument() {
    return selectDocument(this.selectedBranchId)(<RootState>store.getState());
  }

  selectBranch(branchId: string) {
    this.selectedBranchId = branchId;
    getBranchAndContents(store, branchId).then(
      () => (this.selectedDocument = this.getSelectedDocument())
    );
  }

  addNewDocument() {
    store.dispatch(
      createDocument.create({ title: this.newDocumentName, content: '' })
    );
  }

  saveDocument(saveEvent) {
    store.dispatch(
      saveDocument.create({
        branch_address: this.selectedBranchId,
        title: saveEvent.detail.title,
        content: saveEvent.detail.content
      })
    );
  }
}
