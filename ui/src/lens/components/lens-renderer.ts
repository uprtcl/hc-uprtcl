import { LitElement, html, customElement, property } from 'lit-element';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';
import { Lens } from '../types';

/** From the id of the content to render and the viewer id */

import '../../folders/components/folder-list';
import { BaseLens } from './base-lens';

@customElement('lens-renderer')
export class LensRenderer extends BaseLens {
  @property()
  private lens: Lens = {
    element: 'folder-list'
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
