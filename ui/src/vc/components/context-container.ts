import { LitElement, html, customElement, property } from 'lit-element';
import { Branch, Context, Commit } from '../types';
import { connect } from 'pwa-helpers/connect-mixin';

import { store, RootState } from '../../store';
import {
  selectContextBranches,
  selectVersionControl,
  selectObjectFromBranch,
  selectContextById,
  selectBranchHead
} from '../state/selectors';
import {
  getContextBranchesInfo,
  getContextInfo,
  createBranch,
  getBranchHeadCommitContent
} from '../state/actions';

import './branch-selector';
import './commit-history';

@customElement('context-container')
export class ContextContainer extends connect(store)(LitElement) {
  @property({ type: String })
  public contextId: string;

  @property({ type: Object })
  context: Context;

  @property({ type: Boolean })
  loading = true;

  @property({ type: Boolean })
  creatingBranch = false;

  @property({ type: Array })
  branches: Branch[];

  @property({ type: String })
  selectedBranchId: string;

  newBranchName: string;

  render() {
    return html`
      ${this.loading
        ? html`
            <span>Loading context information...</span>
          `
        : html`
            <h3>${this.context.name}</h3>

            <div style="display: flex; flex-direction: column">
              <div style="display: flex; flex-direction: row">
                <branch-selector
                  .branches=${this.branches}
                  @branch-selected="${e =>
                    this.selectBranch(e.detail.branchId)}"
                ></branch-selector>

                <input @keyup=${e => (this.newBranchName = e.target.value)} />
                <button
                  ?disabled=${this.newBranchName != null}
                  @click=${this.createBranch}
                >
                  Create branch
                </button>

                ${this.creatingBranch
                  ? html`
                      <span>Creating branch...</span>
                    `
                  : html``}
              </div>

              <div style="display: flex; flex-direction: row">
                <commit-history
                  .context=${this.context}
                  .branches=${this.branches}
                ></commit-history>
                <div style="flex: 1;">
                  <slot></slot>
                </div>
              </div>
            </div>
          `}
    `;
  }

  loadContext() {
    this.loading = true;

    Promise.all([
      store.dispatch(
        getContextInfo.create({ context_address: this.contextId })
      ),
      getContextBranchesInfo(store, this.contextId)
    ]).then(() => {
      this.loading = false;
      this.selectBranch(this.branches[0].id);
    });
  }

  protected firstUpdated() {
    this.loadContext();
  }

  update(changedProperties) {
    // Don't forget this or your element won't render!
    super.update(changedProperties);
    if (changedProperties.get('contextId')) {
      this.loadContext();
    }
  }

  stateChanged(state: RootState) {
    this.context = selectContextById(this.contextId)(
      selectVersionControl(state)
    );
    this.branches = selectContextBranches(this.contextId)(
      selectVersionControl(state)
    );
  }

  getBranchObject(branchId: string) {
    return selectObjectFromBranch(branchId)(
      selectVersionControl(<RootState>store.getState())
    );
  }

  selectBranch(branchId: string) {
    this.selectedBranchId = branchId;
    getBranchHeadCommitContent(store, branchId).then(() =>
      this.dispatchSelectedEntry(this.getBranchObject(branchId).data)
    );

    this.dispatchSelectedEntry(null);

    const event = new CustomEvent('branch-selected', {
      detail: { branchId: branchId }
    });
    this.dispatchEvent(event);
  }

  createBranch(event) {
    this.creatingBranch = true;
    const commit: Commit = selectBranchHead(this.selectedBranchId)(
      selectVersionControl(<RootState>store.getState())
    );
    store
      .dispatch(
        createBranch.create({
          commit_address: commit.id,
          name: this.newBranchName
        })
      )
      .then(() => {
        this.creatingBranch = false;
        this.loadContext();
      });
  }

  dispatchSelectedEntry(entryId: string) {
    const event = new CustomEvent('entry-selected', {
      detail: {
        entryId: entryId
      }
    });
    this.dispatchEvent(event);
  }
}
