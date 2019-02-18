import { LitElement, html, customElement, property } from 'lit-element';
import { Branch, Context, Commit } from '../types';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from '../../store';
import { selectVersionControl, selectContextHistory } from '../state/selectors';
import { getContextHistory } from '../state/actions';

@customElement('commit-history')
export class CommitHistory extends connect(store)(LitElement) {
  @property({ type: Object })
  public context: Context;

  @property({ type: Array })
  public branches: Branch[];

  @property({ type: Boolean })
  loading = true;

  @property({ type: Array })
  commitHistory: Commit[];

  render() {
    return html`
      ${this.loading
        ? html`
            <span>Loading commit history...</span>
          `
        : html`
            <table>
              <thead>
                <th>Branch</th>
                <th>Id</th>
                <th>Timestamp</th>
                <th>Author</th>
                <th>Message</th>
              </thead>
              ${this.commitHistory.map(
                commit => html`
                  <tr>
                    <td>${this.getBranchesNamesFromCommit(commit.id)}</td>
                    <td>${commit.id}</td>
                    <td>${Date.now()}</td>
                    <td>${commit.author_address}</td>
                    <td>${commit.message}</td>
                  </tr>
                `
              )}
            </table>
          `}
    `;
  }

  loadContext() {
    store
      .dispatch(getContextHistory.create({ context_address: this.context.id }))
      .then(() => (this.loading = false));
  }

  protected firstUpdated() {
    this.loadContext();
  }

  update(changedProperties) {
    // Don't forget this or your element won't render!
    super.update(changedProperties);
    if (changedProperties.get('contextId')) {
      this.loading = true;
      this.loadContext();
    }
  }

  stateChanged(state: RootState) {
    this.commitHistory = selectContextHistory(this.context.id)(
      selectVersionControl(state)
    );
  }

  dispatchSelectedEntry(entryId: string) {
    const event = new CustomEvent('entry-selected', {
      detail: {
        entryId: entryId
      }
    });
    this.dispatchEvent(event);
  }

  getBranchesNamesFromCommit(commitId: string) {
    const branches = this.branches.filter(
      branch => branch.branch_head === commitId
    );
    return branches.length > 0
      ? branches.map(branch => branch.name).join(',')
      : '';
  }
}
