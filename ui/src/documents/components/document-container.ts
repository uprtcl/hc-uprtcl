import { html, customElement, property, TemplateResult } from 'lit-element';
import '@vaadin/vaadin-button/theme/material/vaadin-button.js';
import '@vaadin/vaadin-details/theme/material/vaadin-details.js';
import '@vaadin/vaadin-icons/vaadin-icons.js';
import '@polymer/marked-element/marked-element.js';
import * as _ from 'lodash';

import { store, RootState } from '../../store';
import { selectDocument } from '../state/reducer';
import { Document } from '../types';
import {
  saveDocument,
  saveDocumentAndCommit,
  getDocument
} from '../state/actions';
import { ContextContainer } from '../../vc/components/context-container';
import { Link } from '../../vc/types';

@customElement('document-container')
export class DocumentContainer extends ContextContainer {
  @property({ type: Object })
  document: Document;

  documentContent: string;

  renderContent(editing: boolean) {
    return html`
      ${editing
        ? html`
            <textarea
              style="height: 100px; width: 100%;"
              .value=${this.document.content}
              @keyup="${e => (this.documentContent = e.target.value)}"
            ></textarea>
          `
        : html`
            <marked-element class="fill">
              <div slot="markdown-html"></div>
              <script type="text/markdown">${this.document.content}
              </script>
            </marked-element>
          `}
    `;
  }

  loadContent(entryId) {
    return store.dispatch(getDocument(entryId)).then(() => {
      this.document = selectDocument(entryId)(<RootState>store.getState());
      this.documentContent = this.document.content;
    });
  }

  saveContent(checkoutBranchId: string, links: Link[]) {
    return store.dispatch(
      saveDocumentAndCommit(
        checkoutBranchId,
        '',
        this.document.title,
        this.documentContent,
        links
      )
    );
  }

  renderChild(link: Link): TemplateResult {
    return html`
      <document-container
        .checkoutId=${link.address}
        .editing=${this.editing}
        .rootContainer=${false}
        @entry-selected=${e => (link.address = e.target.entryId)}
      ></document-container>
    `;
  }
}
