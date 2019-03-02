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

import './branch-manager';
import './context-history';

@customElement('context-manager')
export class ContextManager extends connect(store)(LitElement) {
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
              <branch-manager
                .branches=${this.branches}
                .selectedBranchId=${this.checkoutBranchId}
                @branch-selected=${e => this.checkoutBranch(e.detail.branchId)}
                @create-branch=${e => this.createBranch(e.detail.branchName)}
              ></branch-manager>

              ${this.creatingBranch
                ? html`
                    <span>Creating branch...</span>
                    <vaadin-progress-bar
                      indeterminate
                      value="0"
                    ></vaadin-progress-bar>
                  `
                : html``}

              <context-history
                .context=${this.context}
                .branches=${this.branches}
                .checkoutCommitId=${this.checkoutCommitId}
                @checkout-commit=${e => this.checkoutCommit(e.detail.commitId)}
              ></context-history>
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
      store.dispatch(getContextInfo(this.contextId)),
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

  createBranch(branchName: string) {
    this.creatingBranch = true;

    store
      .dispatch(
        createBranch.create({
          commit_address: this.checkoutCommitId,
          name: branchName
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
