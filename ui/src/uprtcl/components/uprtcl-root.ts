import { LitElement, html, customElement, property } from 'lit-element';

import { UprtclHolochain } from '../services/uprtcl.holochain';
import './uprtcl-perspective';

@customElement('uprtcl-root')
export class UprtclRoot extends LitElement {
  @property()
  private rootPerspectiveId: string;

  @property()
  private loading: boolean = true;

  uprtclHolochain = new UprtclHolochain();

  render() {
    return html`
      ${this.loading
        ? html`
            Loading...
          `
        : html`
            <uprtcl-perspective
              .perspectiveId=${this.rootPerspectiveId}
            ></uprtcl-perspective>
          `}
    `;
  }

  firstUpdated() {
    this.loading = true;
    this.uprtclHolochain.getRootPerspective().then(perspective => {
      this.rootPerspectiveId = perspective.id;
      this.loading = false;
    });
  }
}
