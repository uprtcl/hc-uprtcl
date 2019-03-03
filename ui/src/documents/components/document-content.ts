import { LitElement, html, customElement, property } from 'lit-element';
import { Document } from '../types';
import '@vaadin/vaadin-button/theme/material/vaadin-button.js';
import '@vaadin/vaadin-icons/vaadin-icons.js';
import '@polymer/marked-element/marked-element.js';
import { sharedStyles } from '../../vc/styles/styles';

@customElement('document-content')
export class DocumentContent extends LitElement {
  @property({ type: Object })
  public document: Document;

  @property({ type: Boolean })
  editing: boolean = false;

  @property({ type: Boolean })
  saving: boolean = false;

  documentContent: string;

  render() {
    return html`
      ${sharedStyles}

      <div class="row">
        ${this.editing
          ? html`
              <div class="column fill">
                <textarea
                  style="height: 400px; width: 100%;"
                  .value=${this.document.content}
                  @keyup="${e => (this.documentContent = e.target.value)}"
                ></textarea>
                <div class="row">
                  <vaadin-button
                    @click="${e => (this.editing = false)}"
                    style="flex: 1;"
                    ?disabled=${this.saving}
                  >
                    Cancel
                  </vaadin-button>
                  <vaadin-button
                    theme="contained"
                    @click="${this.saveDocument}"
                    ?disabled=${this.documentContent === null}
                    style="flex: 1;"
                    ?disabled=${this.saving}
                  >
                    Save Changes
                  </vaadin-button>
                </div>
              </div>
            `
          : html`
              <marked-element class="fill">
                <div slot="markdown-html"></div>
                <script type="text/markdown">
                  ${this.document.content}
                </script>
              </marked-element>

              <div>
                <vaadin-button
                  theme="icon"
                  @click=${e => (this.editing = true)}
                >
                  <iron-icon icon="vaadin:edit"></iron-icon>
                </vaadin-button>
              </div>
            `}
      </div>
    `;
  }

  saveDocument(event) {
    this.saving = true;
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
