import { LitElement, html, customElement, property, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin.js';
import '@vaadin/vaadin-button/theme/material/vaadin-button.js';
import '@vaadin/vaadin-text-field/theme/material/vaadin-text-field.js';
import '@vaadin/vaadin-progress-bar/theme/material/vaadin-progress-bar.js';

import { store } from '../../store';

import './document-container';
import '../../vc/components/context-manager';
import '../../vc/components/created-contexts';
import { sharedStyles } from '../../vc/styles/styles';
import { saveDocument, createDocument } from '../state/actions';

@customElement('my-documents')
export class MyDocuments extends connect(store)(LitElement) {
  @property({ type: String })
  selectedContextId: string;

  @property({ type: String })
  newDocumentName: string = '';

  @property({ type: Boolean })
  creatingDocument = false;

  render() {
    return html`
      ${sharedStyles}
      <style>
        document-container {
          flex-grow: 1;
        }
      </style>

      <div class="row" style="flex: 1; margin: 12px;">
        <div class="column">
          <h1>My documents</h1>
          <div class="column" style="align-items: center;">
            <vaadin-text-field
              label="Document name"
              @keyup="${e => (this.newDocumentName = e.target.value)}"
            ></vaadin-text-field>
            <vaadin-button
              theme="contained"
              @click="${this.addNewDocument}"
              ?disabled=${this.newDocumentName.length === 0}
            >
              Add new document
            </vaadin-button>
          </div>
          ${this.creatingDocument
            ? html`
                <span>Creating document...</span>
                <vaadin-progress-bar
                  indeterminate
                  value="0"
                ></vaadin-progress-bar>
              `
            : html`
                <created-contexts
                  style="padding: 12px;"
                  @context-selected=${e =>
                    (this.selectedContextId = e.detail.contextId)}
                ></created-contexts>
              `}
        </div>

        <div class="row" style="flex: 1; padding: 20px;">
          ${this.selectedContextId
            ? html`
                <document-container
                  .checkoutId=${this.selectedContextId}
                ></document-container>
              `
            : html``}
        </div>
      </div>
    `;
  }

  addNewDocument() {
    this.creatingDocument = true;
    store.dispatch(createDocument(this.newDocumentName, '')).then(() => {
      this.creatingDocument = false;
    });
  }
}
