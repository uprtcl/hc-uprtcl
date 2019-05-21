import { LitElement, html, customElement, property } from 'lit-element';
import { Perspective, Context } from '../types';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from '../../store';
import { createPerspective } from '../state/perspective/actions';
import { selectUprtcl } from '../state/reducer';
import {
  selectDefaultPerspectiveId,
  selectContextPerspectives
} from '../state/context/selectors';
import { getContextContent } from '../state/context/actions';

import { ReduxLens } from '../../lens/components/redux-lens';

import './uprtcl-perspective';

@customElement('uprtcl-context')
export class UprtclContext extends connect(store)(LitElement) {
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
    store
      .dispatch(getContextContent(this.contextId))
      .then(() => (this.loading = false));
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

  stateChanged(state: RootState) {
    if (!this.checkoutPerspectiveId) {
      this.checkoutPerspectiveId = selectDefaultPerspectiveId(this.contextId)(
        selectUprtcl(state)
      );
    }

    this.perspectives = selectContextPerspectives(this.contextId)(
      selectUprtcl(state)
    );
  }

  getCheckoutPerspective(): Perspective {
    return this.perspectives.find(
      perspective => perspective.id === this.checkoutPerspectiveId
    );
  }

  createPerspective(name): void {
    store
      .dispatch(
        createPerspective(
          this.contextId,
          name,
          this.getCheckoutPerspective().headLink
        )
      )
      .then(() => this.loadContext());
  }
}
