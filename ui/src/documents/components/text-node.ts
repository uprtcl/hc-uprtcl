import { LitElement, html, customElement, property } from 'lit-element';

import { store, RootState } from '../../store';
import { ReduxLens } from '../../lens/components/redux-lens';
import { TextNode } from '../types';
import { getTextNode } from '../state/actions';
import { selectDocuments, selectTextNode } from '../state/reducer';

import '../../lens/components/lens-renderer';

@customElement('text-node')
export class TextNodeElement extends ReduxLens(store) {
  @property()
  private textNode: TextNode;

  render() {
    return this.loadingOrContent(
      () => html`
        <span>${this.textNode.text}</span>
        ${Object.keys(this.textNode.links).map(
          key => html`
            <uprtcl-perspective
              .cid=${this.textNode.links[key]}
            ></uprtcl-perspective>
          `
        )}
      `
    );
  }

  getLoadAction() {
    return getTextNode(this.cid);
  }

  stateChanged(state: RootState) {
    this.textNode = selectTextNode(this.cid)(selectDocuments(state));
  }
}
