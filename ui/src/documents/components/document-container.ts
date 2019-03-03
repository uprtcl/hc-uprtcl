import { LitElement, html, customElement, property } from 'lit-element';
import '@vaadin/vaadin-button/theme/material/vaadin-button.js';
import '@vaadin/vaadin-icons/vaadin-icons.js';
import '@polymer/marked-element/marked-element.js';
import { connect } from 'pwa-helpers/connect-mixin.js';

import './document-content';

import { store, RootState } from '../../store';
import { selectDocument } from '../state/reducer';
import { Document } from '../types';
import { sharedStyles } from '../../vc/styles/styles';
import { saveDocument } from '../state/actions';
import { getCheckout } from '../../vc/state/checkout/actions';
import { selectEntryIdFromCheckout } from '../../vc/state/checkout/selectors';
import { selectVersionControl } from '../../vc/state/reducer';

@customElement('document-container')
export class DocumentContainer extends connect(store)(LitElement) {
  @property({ type: String })
  public checkoutId: string;

  @property({ type: Object })
  selectedDocument: Document;

  @property({ type: Boolean })
  savingDocument = false;

  checkoutBranchId: string;

  render() {
    return html`
      ${sharedStyles}

      <div class="row">
        <context-manager
          style="margin-right: 20px;"
          .initialCheckoutId=${this.checkoutId}
          @branch-checkout=${e => (this.checkoutBranchId = e.detail.branchId)}
          @entry-selected=${e => this.selectDocument(e.detail.entryId)}
        ></context-manager>

        ${this.selectedDocument
          ? html`
              <div class="column">
                ${this.savingDocument
                  ? html`
                      <span>Saving document...</span>
                      <vaadin-progress-bar
                        indeterminate
                        value="0"
                      ></vaadin-progress-bar>
                    `
                  : html``}
                <document-content
                  style="flex-grow: 1;"
                  .document=${this.selectedDocument}
                  @save-document=${this.saveDocument}
                ></document-content>
              </div>
            `
          : html`
              <vaadin-progress-bar
                indeterminate
                value="0"
              ></vaadin-progress-bar>
            `}
      </div>
    `;
  }

  protected firstUpdated() {
    this.loadCheckout();
  }

  update(changedProperties) {
    // Don't forget this or your element won't render!
    super.update(changedProperties);
    if (changedProperties.get('checkoutId')) {
      this.loadCheckout();
    }
  }

  loadCheckout() {
    store
      .dispatch(getCheckout(this.checkoutId))
      .then(() =>
        this.selectDocument(
          selectEntryIdFromCheckout(this.checkoutId)(
            selectVersionControl(<RootState>store.getState())
          )
        )
      );
  }

  selectDocument(documentId: string) {
    this.selectedDocument = selectDocument(documentId)(<RootState>(
      store.getState()
    ));
  }

  saveDocument(saveEvent) {
    this.savingDocument = true;
    store
      .dispatch(
        saveDocument.create({
          branch_address: this.checkoutBranchId,
          title: saveEvent.detail.title,
          content: saveEvent.detail.content
        })
      )
      .then(() => {
        this.savingDocument = false;
        const aux = this.checkoutId;
        this.checkoutId = null;
        setTimeout(() => (this.checkoutId = aux));
      });
  }
}
