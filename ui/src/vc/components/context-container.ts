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
  getBranchAndContents,
  getContextInfo,
  createBranch
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
              </div>

              <div style="display: flex; flex-direction: row">
                <commit-history
                  style="width: 40%; overflow: auto;"
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

  getSelectedObject() {
    return selectObjectFromBranch(this.selectedBranchId)(
      selectVersionControl(<RootState>store.getState())
    );
  }

  selectBranch(branchId: string) {
    this.selectedBranchId = branchId;
    getBranchAndContents(store, branchId).then(() =>
      this.dispatchSelectedEntry(this.getSelectedObject().data)
    );

    this.dispatchSelectedEntry(null);

    const event = new CustomEvent('branch-selected', {
      detail: { branchId: branchId }
    });
    this.dispatchEvent(event);
  }

  createBranch(event) {
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
      .then(() => this.loadContext());
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
