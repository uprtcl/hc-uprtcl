import { LitElement, html, customElement, property } from 'lit-element';
import { Perspective } from '../types';

import './uprtcl-commit';
import './uprtcl-placeholder';
import { UprtclHolochain } from '../services/uprtcl.holochain';

@customElement('uprtcl-perspective')
export class UprtclPerspective extends LitElement {
  @property()
  public perspectiveId: string;

  @property()
  private perspective: Perspective;

  @property()
  private loading: boolean = true;

  uprtclHolochain = new UprtclHolochain();

  renderPerspective() {
    return html`
      ${this.loading
        ? html`
            Loading...
          `
        : html`
            <uprtcl-commit
              .commitId=${this.perspective.headId}
              @commit-content=${e => {
                this.createCommit(e.detail.dataId);
                e.stopPropagation();
              }}
            >
              <slot></slot>
            </uprtcl-commit>
          `}
    `;
  }

  render() {
    return html`
      ${this.perspectiveId
        ? this.renderPerspective()
        : html`
            <uprtcl-placeholder><slot></slot></uprtcl-placeholder>
          `}
    `;
  }

  loadPerspective() {
    if (this.perspectiveId) {
      this.loading = true;
      this.uprtclHolochain
        .getPerspective(this.perspectiveId)
        .then(perspective => {
          this.perspective = perspective;
          this.loading = false;
        });
    }
  }

  firstUpdated() {
    this.loadPerspective();
  }

  updated(changedProperties) {
    // Don't forget this or your element won't render!
    super.updated(changedProperties);
    if (changedProperties.has('perspectiveId')) {
      this.loadPerspective();
    }
  }

  createCommit(dataId: string) {
    this.uprtclHolochain
      .createCommit(Date.now(), '', [this.perspective.headId], dataId)
      .then(commitId =>
        this.uprtclHolochain.updateHead(this.perspectiveId, commitId)
      );
  }
}
