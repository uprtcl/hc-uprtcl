import { LitElement, html, customElement, property } from 'lit-element';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';

/** From the id of the content to render and the viewer id */

import { Lens } from '../types';
import '../../documents/components/text-node';

@customElement('lens-renderer')
export class LensRenderer extends LitElement {
  @property()
  public element: string;

  @property()
  public dataLink: string;

  @property()
  private lens: Lens = {
    element: 'text-node'
  };

  buildElement() {
    return `
      <${this.lens.element}>
      </${this.lens.element}>
    `;
  }

  firstUpdated() {
    this.shadowRoot.firstElementChild['dataId'] = this.dataLink;
  }

  render() {
    return html`
      ${unsafeHTML(this.buildElement())}
    `;
  }
}
