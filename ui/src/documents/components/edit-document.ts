import { LitElement, html, customElement, property } from 'lit-element';
import { Document } from '../types';
import '@vaadin/vaadin-button/theme/material/vaadin-button.js';
import '@vaadin/vaadin-tabs/theme/material/vaadin-tabs.js';
import '@polymer/marked-element/marked-element.js';

@customElement('edit-document')
export class EditDocument extends LitElement {
  @property({ type: Object })
  public document: Document;

  @property({ type: Number })
  selectedTab: number = 1;

  documentContent: string;

  render() {
    return html`
      <div style="display: flex; flex-direction: column; flex: 1;">
      <vaadin-tabs .selected=${this.selectedTab}>
        <vaadin-tab @click=${() => this.selectedTab = 0}>Edit</vaadin-tab>
        <vaadin-tab @click=${() => this.selectedTab = 1}>Preview</vaadin-tab>
      </vaadin-tabs>

${this.selectedTab === 0 ? 
html`
        <textarea
          style="height: 300px;"
          .value=${this.document.content}
          @keyup="${e => (this.documentContent = e.target.value)}"
        ></textarea>
        <vaadin-button
          theme="contained"
          @click="${this.saveDocument}"
          ?disabled=${this.documentContent === null}
        >
          Save Changes
        </vaadin-button>` : 
        html`
            <marked-element>
      <div slot="markdown-html"></div>
      <script type="text/markdown">
      ${this.document.content}
      </script></marked-element>
`
}
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
