import { LitElement, html, customElement, property } from 'lit-element';

import '../../lens/components/lens-renderer';
import { store, RootState } from '../../store';
import { Commit } from '../types';
import { getCommit } from '../state/commit/actions';
import { selectCommitById } from '../state/commit/selectors';
import { selectUprtcl } from '../state/reducer';
import { ReduxLens } from '../../lens/components/redux-lens';
import { connect } from 'pwa-helpers/connect-mixin';

@customElement('uprtcl-commit')
export class UprtclCommit extends connect(store)(LitElement) {
  @property()
  public commitId: string;

  @property()
  private commit: Commit;

  @property()
  private loading: boolean = !this.commitId;

  render() {
    return html`
      ${this.loading
        ? html`
            Loading...
          `
        : html`
            <lens-renderer .dataLink=${this.commit.dataLink}></lens-renderer>
          `}
    `;
  }

  loadCommit() {
    this.loading = true;
    store.dispatch(getCommit(this.commitId)).then(() => (this.loading = false));
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

  stateChanged(state: RootState) {
    this.commit = selectCommitById(this.commitId)(selectUprtcl(state));
  }
}
