import { LitElement, html, customElement, property } from 'lit-element';

import { UprtclHolochain } from '../services/uprtcl.holochain';

@customElement('uprtcl-placeholder')
export class UprtclPlaceholder extends LitElement {
  uprtclHolochain = new UprtclHolochain();

  render() {
    return html`
      <slot
        @commit-content=${e => {
          this.createContent(e.detail.dataId);
          e.stopPropagation();
        }}
      ></slot>
    `;
  }

  async createContent(dataId: string) {
    const contextId = await this.uprtclHolochain.createContext(Date.now(), 0);
    const commitId = await this.uprtclHolochain.createCommit(
      Date.now(),
      'initial commit',
      [],
      dataId
    );
    const perspectiveId = await this.uprtclHolochain.createPerspective(
      contextId,
      'master',
      Date.now(),
      commitId
    );

    this.dispatchEvent(
      new CustomEvent('perspective-created', {
        detail: { perspectiveId: perspectiveId },
        composed: true,
        bubbles: true
      })
    );
  }
}
