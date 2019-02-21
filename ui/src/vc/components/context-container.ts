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
  selectBranchHead,
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

  @property({ type: String })
  checkoutCommitId: string;

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
              <div style="display: flex; flex-direction: row">
                <branch-selector
                  .branches=${this.branches}
                  @branch-selected="${e =>
                    this.selectBranch(e.detail.branchId)}"
                ></branch-selector>

                <vaadin-text-field
                  label="New branch name"
                  @keyup=${e => (this.newBranchName = e.target.value)}
                ></vaadin-text-field>
                <vaadin-button
                  theme="contained"
                  ?disabled=${this.newBranchName != null}
                  @click=${this.createBranch}
                >
                  Create branch
                </vaadin-button>

                ${this.creatingBranch
                  ? html`
                      <span>Creating branch...</span>
                      <vaadin-progress-bar indeterminate value="0"></vaadin-progress-bar>
                    `
                  : html``}
              </div>

              <div style="display: flex; flex-direction: row">
                <commit-history
                  .context=${this.context}
                  .branches=${this.branches}
                  .checkoutCommitId=${this.checkoutCommitId}
                  @checkout-commit=${e =>
                    this.checkoutCommit(e.detail.commitId)}
                ></commit-history>
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
      this.selectBranch(this.branches[0].id);
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

  selectBranch(branchId: string) {
    this.selectedBranchId = branchId;
    this.checkoutCommit(
      selectBranchHeadId(branchId)(
        selectVersionControl(<RootState>store.getState())
      )
    );

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

  checkoutCommit(commitId: string) {
    this.checkoutCommitId = commitId;
    this.dispatchSelectedEntry(null);

    store.dispatch(getCommitAndContents(commitId)).then(() => {
      const object = selectObjectFromCommit(commitId)(
        selectVersionControl(<RootState>store.getState())
      );
      this.dispatchSelectedEntry(object.data);
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
