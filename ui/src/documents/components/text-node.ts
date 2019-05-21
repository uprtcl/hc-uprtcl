import { LitElement, html, customElement, property } from 'lit-element';

import { store, RootState } from '../../store';
import { ReduxLens } from '../../lens/components/redux-lens';
import { TextNode } from '../types';
import { getTextNode } from '../state/actions';
import { selectDocuments, selectTextNode } from '../state/reducer';

import '../../lens/components/lens-renderer';
import { connect } from 'pwa-helpers/connect-mixin';

@customElement('text-node')
export class TextNodeElement extends connect(store)(LitElement) {
  @property()
  public dataId: string;

  @property()
  private loading: boolean = true;

  @property()
  private node: TextNode;

  render() {
    return html`
      ${this.loading
        ? html`
            Loading...
          `
        : html`
            <span contenteditable="true" @keydown=${e => this.onKeyDown(e)}>
              ${this.node.text}
            </span>
            ${Object.keys(this.node.links).map(
              key => html`
                <uprtcl-perspective
                  .perspectiveId=${this.node.links[key]}
                >
              
              </uprtcl-perspective>
              `
            )}
          `}
    `;
  }

  firstUpdated() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    store.dispatch(getTextNode(this.dataId)).then(() => (this.loading = false));
  }

  updated(changedProperties) {
    // Don't forget this or your element won't render!
    super.updated(changedProperties);
    if (changedProperties.has('dataId')) {
      this.loadData();
    }
  }

  stateChanged(state: RootState) {
    this.node = selectTextNode(this.dataId)(selectDocuments(state));
  }

  onKeyDown(event) {
    console.log(this.node);
    if (event.code === 'Enter') {
      this.node.links.push({ link: '' });
    }
  }
}
