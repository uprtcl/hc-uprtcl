import { LitElement, html, customElement, property } from 'lit-element';
import { Perspective } from '../types';
import { store, RootState } from '../../store';

import { selectUprtcl } from '../state/reducer';
import { getPerspectiveContent } from '../state/perspective/actions';
import { selectPerspectiveById } from '../state/perspective/selectors';
import { createCommit } from '../state/commit/actions';

import { ReduxLens } from '../../lens/components/redux-lens';
import './uprtcl-commit';

@customElement('uprtcl-perspective')
export class UprtclPerspective extends ReduxLens(store) {
  @property()
  private perspective: Perspective;

  render() {
    return this.loadingOrContent(
      () => html`
        <uprtcl-commit
          .cid=${this.perspective.headLink}
          @commit-content=${e => {
            this.createCommit(e.detail.cid);
            e.stopPropagation();
          }}
        ></uprtcl-commit>
      `
    );
  }

  getLoadAction() {
    return getPerspectiveContent(this.cid);
  }

  stateChanged(state: RootState) {
    this.perspective = selectPerspectiveById(this.cid)(selectUprtcl(state));
  }

  createCommit(contentAddress: string) {
    store
      .dispatch(createCommit(this.cid, '', contentAddress))
      .then(() => this.loadContent());
  }
}
