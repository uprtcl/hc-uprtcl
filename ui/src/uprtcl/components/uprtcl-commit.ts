import { LitElement, html, customElement, property } from 'lit-element';

import '../../lens/components/lens-renderer';
import { Commit } from '../types';
import { UprtclHolochain } from '../services/uprtcl.holochain';

@customElement('uprtcl-commit')
export class UprtclCommit extends LitElement {
  @property()
  public commitId: string;

  @property()
  private commit: Commit;

  @property()
  private loading: boolean = !this.commitId;

  uprtclHolochain = new UprtclHolochain();

  render() {
    return html`
      ${this.loading
        ? html`
            Loading...
          `
        : html`
            <slot id="data"></slot>
          `}
    `;
  }

  loadCommit() {
    this.loading = true;
    this.uprtclHolochain.getCommit(this.commitId).then(commit => {
      this.commit = commit;
      this.loading = false;
      const slot = this.shadowRoot.querySelector('slot');

      slot
        .assignedNodes({ flatten: true })
        .filter(node => node.nodeType === 1)
        .forEach(e => (e['dataId'] = commit.dataId));
    });
  }

  firstUpdated() {
    this.loadCommit();
  }

  updated(changedProperties) {
    // Don't forget this or your element won't render!
    super.updated(changedProperties);
    if (changedProperties.has('commitId')) {
      this.loadCommit();
    }
  }
}
