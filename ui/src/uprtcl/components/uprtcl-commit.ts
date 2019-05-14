import { LitElement, html, customElement, property } from 'lit-element';

import '../../lens/components/lens-renderer';
import { store, RootState } from '../../store';
import { Commit } from '../types';
import { getCommit } from '../state/commit/actions';
import { selectCommitById } from '../state/commit/selectors';
import { selectUprtcl } from '../state/reducer';
import { ReduxLens } from '../../lens/components/redux-lens';

@customElement('uprtcl-commit')
export class UprtclCommit extends ReduxLens(store) {
  @property()
  private commit: Commit;

  render() {
    return this.loadingOrContent(
      () => html`
        <lens-renderer .cid=${this.commit.content_address}></lens-renderer>
      `
    );
  }

  getLoadAction() {
    return getCommit(this.cid);
  }

  stateChanged(state: RootState) {
    this.commit = selectCommitById(this.cid)(selectUprtcl(state));
  }
}
