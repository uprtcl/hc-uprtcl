import { html, customElement, property, TemplateResult } from 'lit-element';
import '@vaadin/vaadin-button/theme/material/vaadin-button.js';
import '@vaadin/vaadin-details/theme/material/vaadin-details.js';
import '@vaadin/vaadin-icons/vaadin-icons.js';
import '@polymer/marked-element/marked-element.js';
import * as _ from 'lodash';

import { store, RootState } from '../../store';
import { selectDocument } from '../state/reducer';
import { Document } from '../types';
import { saveDocument } from '../state/actions';
import { ContextContainer } from '../../vc/components/context-container';

@customElement('document-container')
export class DocumentContainer extends ContextContainer {
  @property({ type: Object })
  document: Document;

  documentContent: string;

  renderContent(documentId: string) {
    this.document = selectDocument(documentId)(<RootState>store.getState());
    return html`
      ${this.editing
        ? html`
            <textarea
              style="height: 300px; width: 100%;"
              .value=${this.document.content}
              @keyup="${e => (this.documentContent = e.target.value)}"
            ></textarea>
          `
        : html`
            <marked-element class="fill">
              <div slot="markdown-html"></div>
              <script type="text/markdown">
                ${this.document.content}
              </script>
            </marked-element>
          `}
    `;
  }

  saveContent() {
    return store.dispatch(
      saveDocument.create({
        branch_address: this.checkoutBranchId,
        title: this.document.title,
        content: this.documentContent
      })
    );
  }

  renderChild(childAddress: string): TemplateResult {
    return html`
      <document-container
        .checkoutId=${childAddress}
        .editing=${this.editing}
        .rootContainer=${false}
      ></document-container>
    `;
  }
}
