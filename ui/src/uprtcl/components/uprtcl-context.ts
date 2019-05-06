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
export class UprtclContext extends ReduxLens(store) {
  @property()
  private checkoutPerspectiveId: string;

  @property()
  private perspectives: Perspective[];

  @property()
  private newPerspectiveName: string;

  render() {
    return this.loadingOrContent(
      () => html`
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
                      ?selected=${perspective.id === this.checkoutPerspectiveId}
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
          <uprtcl-perspective .cid=${this.checkoutPerspectiveId}>
          </uprtcl-perspective>
        </div>
      `
    );
  }

  getLoadAction() {
    return getContextContent(this.cid);
  }

  stateChanged(state: RootState) {
    if (!this.checkoutPerspectiveId) {
      this.checkoutPerspectiveId = selectDefaultPerspectiveId(this.cid)(
        selectUprtcl(state)
      );
    }

    this.perspectives = selectContextPerspectives(this.cid)(
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
        createPerspective.create({
          context_address: this.cid,
          commit_address: this.getCheckoutPerspective().head,
          name: name
        })
      )
      .then(() => this.loadContent());
  }
}
