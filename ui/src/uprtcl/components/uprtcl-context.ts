import { LitElement, html, customElement, property } from 'lit-element';
import { Perspective, Context } from '../types';

import './uprtcl-perspective';
import { UprtclHolochain } from '../services/uprtcl.holochain';

@customElement('uprtcl-context')
export class UprtclContext extends LitElement {
  @property()
  public contextId: string;

  @property()
  private checkoutPerspectiveId: string;

  @property()
  private perspectives: Perspective[];

  @property()
  private newPerspectiveName: string;

  @property()
  private loading: boolean = false;

  uprtclHolochain = new UprtclHolochain();

  render() {
    return html`
      ${this.loading
        ? html`
            Loading...
          `
        : html`
            <div style="display: flex; flex-direction: column">
              <div style="display: flex; flex-direction: row;">
                <select
                  @change=${e => (this.checkoutPerspectiveId = e.target.value)}
                >
                  ${this.perspectives.map(
                    perspective =>
                      html`
                        <option
                          value="${perspective.id}"
                          ?selected=${perspective.id ===
                            this.checkoutPerspectiveId}
                        >
                          ${perspective.name}
                        </option>
                      `
                  )}
                </select>

                <input
                  @change=${e => (this.newPerspectiveName = e.target.value)}
                  type="text"
                  style="margin-left: 8px;"
                />
                <button
                  @click=${e => this.createPerspective(this.newPerspectiveName)}
                  ?disabled=${!this.newPerspectiveName}
                >
                  Create perspective
                </button>
              </div>
              <uprtcl-perspective .perspectiveId=${this.checkoutPerspectiveId}>
              </uprtcl-perspective>
            </div>
          `}
    `;
  }

  loadContext() {
    this.loading = true;
    this.uprtclHolochain
      .getContextPerspectives(this.contextId)
      .then(perspectives => {
        this.perspectives = perspectives;
        if (!this.checkoutPerspectiveId) {
          this.checkoutPerspectiveId = perspectives[0].id;
        }
      });
  }

  firstUpdated() {
    this.loadContext();
  }

  updated(changedProperties) {
    // Don't forget this or your element won't render!
    super.updated(changedProperties);
    if (changedProperties.has('contextId')) {
      this.loadContext();
    }
  }

  getCheckoutPerspective(): Perspective {
    return this.perspectives.find(
      perspective => perspective.id === this.checkoutPerspectiveId
    );
  }

  createPerspective(name): void {
    this.uprtclHolochain
      .createPerspective(
        this.contextId,
        name,
        Date.now(),
        this.getCheckoutPerspective().headId
      )
      .then(() => this.loadContext());
  }
}
