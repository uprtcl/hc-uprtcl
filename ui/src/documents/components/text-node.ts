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
    text: '',
    links: []
  };

  @property()
  mouseover: boolean = false;

  newText: string;

  documentsHolochain = new DocumentsHolochain();

  static get styles() {
    return css`
      .hover:hover {
        background-color: rgba(100, 100, 100, 0.2);
      }
      .node {
        padding: 4px;
        border-radius: 4px;
      }

      #text {
        display: inline-block;
        content: 'Start typing';
      }
      #text:empty:focus::before {
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
            <div
              style="display: flex; flex-direction: column;"
              class=${this.mouseover ? 'hover node' : 'node'}
            >
              <div
                style="display: flex; flex-direction: row;"
                @mouseover=${e => (this.mouseover = true)}
                @mouseleave=${e => (this.mouseover = false)}
              >
                <span
                  id="text"
                  data-focused-advice="Start typing"
                  contenteditable="true"
                  @input=${e => this.updateText()}
                  @keydown=${e => this.onKeyDown(e)}
                  style="flex-basis: 100%;"
                >
                  ${this.node.text}
                </span>
                ${this.mouseover
                  ? html`
                      <button class="save-button" @click=${e => this.save()}>
                        Save
                      </button>
                    `
                  : html``}
              </div>
              ${this.node.links.map(
                (link, index) => html`
                  <uprtcl-perspective
                    .perspectiveId=${link}
                    @perspective-created=${e => {
                      this.node.links[index] = e.detail.perspectiveId;
                      this.save();
                      this.requestUpdate();
                      e.stopPropagation();
                    }}
                  >
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

  updateText() {
    this.newText = this.shadowRoot.getElementById('text').innerText;
  }

  onKeyDown(event) {
    if (event.key === 'Enter') {
      this.node.links.push(null);
      this.requestUpdate();
      event.preventDefault();
    }
  }

  save() {
    const node: TextNode = { ...this.node };
    if (this.newText) {
      node.text = this.newText;
    }
    this.documentsHolochain.createTextNode(node).then(nodeId =>
      this.dispatchEvent(
        new CustomEvent('commit-content', {
          detail: { dataId: nodeId },
          composed: true,
          bubbles: true
        })
      )
    );
  }
}
