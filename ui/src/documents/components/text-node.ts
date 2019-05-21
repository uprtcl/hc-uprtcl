import { LitElement, html, customElement, property, css } from 'lit-element';

import { TextNode } from '../types';

import '../../lens/components/lens-renderer';
import { DocumentsHolochain } from '../services/documents.holochain';

@customElement('text-node')
export class TextNodeElement extends LitElement {
  @property()
  public dataId: string;

  @property()
  private loading: boolean = !!this.dataId;

  @property()
  private node: TextNode = {
    text: 'placeholder',
    links: []
  };

  documentsHolochain = new DocumentsHolochain();

  static get styles() {
    return css`
      .hover:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }
    `;
  }

  render() {
    return html`
      ${this.loading
        ? html`
            Loading...
          `
        : html`
            <div style="display: flex; flex-direction: column;" class="hover">
              <span contenteditable="true" @keydown=${e => this.onKeyDown(e)}>
                ${this.node.text}
              </span>
              ${this.node.links.map(
                link => html`
                  <uprtcl-perspective .perspectiveId=${link.link}>
                    <text-node></text-node>
                  </uprtcl-perspective>
                `
              )}
            </div>
          `}
    `;
  }

  firstUpdated() {
    if (this.dataId) {
      this.loadData();
    }
  }

  loadData() {
    this.loading = true;
    this.documentsHolochain.getTextNode(this.dataId).then(node => {
      this.node = node;
      this.loading = false;
    });
  }

  updated(changedProperties) {
    // Don't forget this or your element won't render!
    super.updated(changedProperties);
    if (changedProperties.has('dataId')) {
      this.loadData();
    }
  }

  onKeyDown(event) {
    if (event.key === 'Enter') {
      this.node.links.push({ link: null });
      this.requestUpdate();
      event.preventDefault();
    }
  }
}
