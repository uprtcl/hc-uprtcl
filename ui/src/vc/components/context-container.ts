import { LitElement, html, customElement, property } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import '@vaadin/vaadin-button/theme/material/vaadin-button.js';
import '@vaadin/vaadin-text-field/theme/material/vaadin-text-field.js';

import { Branch, Context, Commit } from '../types';
import { store, RootState } from '../../store';
import {
  selectContextBranches,
  selectVersionControl,
  selectContextById,
  selectObjectFromCommit,
  selectBranchHeadId
} from '../state/selectors';
import {
  getContextBranchesInfo,
  getContextInfo,
  createBranch,
  getCommitAndContents
} from '../state/actions';

import './branch-selector';
import './context-history';

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
  checkoutBranchId: string;

  @property({ type: String })
  checkoutCommitId: string;

  @property({ type: String })
  newBranchName: string;

  render() {
    return html`
      ${this.loading
        ? html`
            <span>Loading context information...</span>
            <vaadin-progress-bar indeterminate value="0"></vaadin-progress-bar>
          `
        : html`
            <h3>${this.context.name}</h3>

            <div style="display: flex; flex-direction: column">
              <div
                style="display: flex; flex-direction: row; align-items: center;"
              >
                <branch-selector
                  .branches=${this.branches}
                  .selectedBranchId=${this.checkoutBranchId}
                  @branch-selected=${e =>
                    this.checkoutBranch(e.detail.branchId)}
                ></branch-selector>

                <vaadin-text-field
                  style="margin-left: 12px;"
                  label="New branch name"
                  @keyup=${e => (this.newBranchName = e.target.value)}
                ></vaadin-text-field>
                <vaadin-button
                  theme="contained"
                  ?disabled=${!this.newBranchName}
                  @click=${this.createBranch}
                >
                  Create branch
                </vaadin-button>

                ${this.creatingBranch
                  ? html`
                      <span>Creating branch...</span>
                      <vaadin-progress-bar
                        indeterminate
                        value="0"
                      ></vaadin-progress-bar>
                    `
                  : html``}
              </div>

              <div style="display: flex; flex-direction: row">
                <context-history
                  .context=${this.context}
                  .branches=${this.branches}
                  .checkoutCommitId=${this.checkoutCommitId}
                  @checkout-commit=${e =>
                    this.checkoutCommit(e.detail.commitId)}
                ></context-history>
                <div style="flex: 1;">
                  <slot></slot>
                </div>
              </div>
            </div>
          `}
    `;
  }

  protected firstUpdated() {
    this.loadContext();
  }

  loadContext() {
    this.loading = true;

    Promise.all([
      store.dispatch(
        getContextInfo.create({ context_address: this.contextId })
      ),
      store.dispatch(getContextBranchesInfo(this.contextId))
    ]).then(() => {
      this.loading = false;
      this.checkoutBranch(this.branches[0].id);
    });
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

  checkoutBranch(branchId: string) {
    this.checkoutCommit(
      selectBranchHeadId(branchId)(
        selectVersionControl(<RootState>store.getState())
      ),
      branchId
    );
  }

  checkoutCommit(commitId: string, branchId: string = null) {
    this.checkoutCommitId = commitId;
    if (!branchId) {
      const branch = this.branches.find(
        branch => branch.branch_head === commitId
      );
      if (branch) branchId = branch.id;
    }
    this.checkoutBranchId = branchId;

    this.dispatchSelectedEntry(null);

    store.dispatch(getCommitAndContents(commitId)).then(() => {
      const object = selectObjectFromCommit(commitId)(
        selectVersionControl(<RootState>store.getState())
      );

      this.dispatchSelectedEntry(object.data);
    });

    this.dispatchEvent(
      new CustomEvent('branch-checkout', {
        detail: { branchId: branchId }
      })
    );
  }

  createBranch(event) {
    this.creatingBranch = true;

    store
      .dispatch(
        createBranch.create({
          commit_address: this.checkoutCommitId,
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
