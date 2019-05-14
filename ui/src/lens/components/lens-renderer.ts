import { LitElement, html, customElement, property } from 'lit-element';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';
import { Lens } from '../types';

/** From the id of the content to render and the viewer id */

import '../../documents/components/document-node';
import { BaseLens } from './base-lens';

@customElement('lens-renderer')
export class LensRenderer extends BaseLens {
  @property()
  private lens: Lens = {
    element: 'document-node'
  };

  buildElement() {
    return `
      <${this.lens.element}>
      </${this.lens.element}>
    `;
  }

  render() {
    return this.loadingOrContent(
      () => html`
        ${unsafeHTML(this.buildElement())}
      `
    );
  }

  loadContent() {
    //import(this.lens.element).then(() => (this.loading = false));
    this.shadowRoot.firstElementChild['cid'] = this.cid;
  }
}
