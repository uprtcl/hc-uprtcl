import {
  LitElement,
  html,
  customElement,
  property,
  TemplateResult
} from 'lit-element';
import { Perspective } from '../types';
import { store, RootState } from '../../store';

import { selectUprtcl } from '../state/reducer';
import {
  getPerspectiveContent,
  getPerspective
} from '../state/perspective/actions';
import { selectPerspectiveById } from '../state/perspective/selectors';
import { createCommit } from '../state/commit/actions';

import './uprtcl-commit';
import { connect } from 'pwa-helpers/connect-mixin';

@customElement('uprtcl-perspective')
export class UprtclPerspective extends connect(store)(LitElement) {
  @property()
  public perspectiveId: string;

  @property()
  private perspective: Perspective;

  @property()
  private loading: boolean = true;

  renderEmptyPerspective(): TemplateResult {
    return html``;
  }

  renderPerspective() {
    return html`
      ${this.loading
        ? html`
            Loading...
          `
        : html`
            <uprtcl-commit
              .commitId=${this.perspective.headLink}
              @commit-content=${e => {
                this.createCommit(e.detail.dataLink);
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
        : this.renderEmptyPerspective()}
    `;
  }

  loadPerspective() {
    this.loading = true;
    store
      .dispatch(getPerspective(this.perspectiveId))
      .then(() => (this.loading = false));
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

  stateChanged(state: RootState) {
    this.perspective = selectPerspectiveById(this.perspectiveId)(
      selectUprtcl(state)
    );
  }

  createCommit(dataLink: string) {
    store
      .dispatch(createCommit(this.perspectiveId, '', dataLink))
      .then(() => this.loadPerspective());
  }
}
