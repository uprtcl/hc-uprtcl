import { LitElement, html, property, TemplateResult } from 'lit-element';
import '@vaadin/vaadin-button/theme/material/vaadin-button.js';
import '@vaadin/vaadin-details/theme/material/vaadin-details.js';
import '@vaadin/vaadin-icons/vaadin-icons.js';
import '@polymer/marked-element/marked-element.js';
import { connect } from 'pwa-helpers/connect-mixin.js';
import * as _ from 'lodash';

import './context-selector';
import './context-manager';
import './details-toggle';

import { store, RootState } from '../../store';
import { CommitObject, Link, Context, Branch } from '../types';
import { sharedStyles } from '../styles/styles';
import { getCheckout, getCheckoutAndContent } from '../state/checkout/actions';
import {
  selectObjectFromCheckout,
  selectContextIdFromCheckout,
  selectBranchIdFromCheckout
} from '../state/checkout/selectors';
import { selectVersionControl, VersionControlState } from '../state/reducer';
import { selectContextBranches } from '../state/context/selectors';
import { createBranch } from '../state/branch/actions';
import { selectBranchHead, selectBranchById } from '../state/branch/selectors';

export abstract class ContextContainer extends connect(store)(LitElement) {
  @property({ type: String })
  public checkoutId: string;

  @property({ type: Boolean })
  public rootContainer: boolean = true;

  @property({ type: Boolean })
  public editing: boolean = false;

  @property({ type: Object })
  commitObject: CommitObject;
  backupObject: CommitObject;

  @property({ type: Array })
  branches: Branch[];

  @property({ type: String })
  selectedEntryId: string;

  @property({ type: Boolean })
  loading = true;

  @property({ type: Boolean })
  loadingContent = false;

  @property({ type: Boolean })
  commiting = false;

  @property({ type: Boolean })
  showContextManager = false;

  contextId: string;
  checkoutBranchId: string;
  checkoutCommitId: string;

  abstract loadContent(entryId: string): Promise<any>;
  abstract renderContent(editing: boolean): TemplateResult;
  abstract renderChild(link: Link): TemplateResult;
  abstract saveContent(checkoutBranchId: string, links: Link[]): Promise<any>;

  loadingIf(condition: any, content: () => TemplateResult): TemplateResult {
    return html`
      ${condition
        ? html`
            <vaadin-progress-bar indeterminate value="0"></vaadin-progress-bar>
          `
        : content()}
    `;
  }

  render() {
    return html`
      ${sharedStyles}
      <style>
        .disabled-manager {
          opacity: 0.4;
          pointer-events: none;
        }
      </style>
      ${this.loadingIf(
        this.loading,
        () =>
          html`
            <div class="column fill">
              ${this.renderToolbar()}
              <div class="row fill">
                ${this.loadingIf(this.loadingContent, () =>
                  this.renderContent(this.editing)
                )}
                ${this.showContextManager
                  ? this.renderContextManager()
                  : html``}
              </div>

              ${this.loadingIf(this.loadingContent, () =>
                this.renderChildren()
              )}
            </div>
          `
      )}
    `;
  }

  renderToolbar(): TemplateResult {
    return html`
      <div
        class="row"
        style="align-items: flex-end; place-content: space-evenly;"
      >
        ${this.rootContainer
          ? html`
              ${this.editing
                ? html`
                    <vaadin-button
                      theme="icon"
                      @click="${e => this.commitChanges()}"
                      ?disabled=${this.commiting}
                    >
                      <iron-icon icon="vaadin:disc"></iron-icon>
                    </vaadin-button>
                    <vaadin-button
                      theme="icon"
                      @click="${e => this.toggleEditing()}"
                      ?disabled=${this.commiting}
                    >
                      <iron-icon icon="vaadin:close"></iron-icon>
                    </vaadin-button>
                  `
                : html`
                    <vaadin-button
                      theme="icon"
                      @click=${e => this.toggleEditing()}
                      ?disabled=${!this.checkoutBranchId}
                    >
                      <iron-icon icon="vaadin:edit"></iron-icon>
                    </vaadin-button>
                  `}
            `
          : html``}

        <div
          class="row"
          style="align-items: flex-end; place-content: flex-end;"
        >
          <branch-manager
            .branches=${this.branches}
            .selectedBranchId=${this.checkoutBranchId}
            @checkout-branch=${e => this.checkoutBranch(e.detail.branchId)}
            @create-branch=${e => this.createBranch(e.detail.branchName)}
          ></branch-manager>

          <vaadin-button
            theme="icon"
            @click=${e => (this.showContextManager = !this.showContextManager)}
          >
            <iron-icon icon="vaadin:file-tree"></iron-icon>
          </vaadin-button>
        </div>
      </div>
    `;
  }

  renderContextManager() {
    return html`
      <context-history
        style="max-height: 250px; overflow: auto;"
        class="${this.editing && this.rootContainer ? 'disabled-manager' : ''}"
        .contextId=${this.contextId}
        .branches=${this.branches}
        .checkoutCommitId=${this.checkoutCommitId}
        @checkout-commit=${e => this.checkoutCommit(e.detail.commitId)}
      ></context-history>
    `;
  }

  renderChildren(): TemplateResult {
    return html`
      <div class="column">
        ${this.commitObject
          ? this.commitObject.links.map((link, index) =>
              this.renderChildLink(link, index)
            )
          : html``}
        ${this.editing
          ? html`
              <div>
                <vaadin-button @click="${e => this.createEmptyChild()}">
                  Add child
                </vaadin-button>
              </div>
            `
          : html``}
      </div>
    `;
  }

  renderChildLink(link: Link, index: number): TemplateResult {
    return html`
      <div class="row">
        ${this.editing
          ? html`
              <vaadin-button
                theme="icon"
                @click="${e => {
                  this.commitObject.links.splice(index, 1);
                  this.requestUpdate();
                }}"
              >
                <iron-icon icon="vaadin:close"></iron-icon>
              </vaadin-button>
            `
          : html``}

        <details-toggle style="flex-grow: 1;">
          <div slot="title">
            ${this.editing
              ? html`
                  <context-selector
                    .filterIds=${[this.contextId]}
                    .selectedContextName=${link.name}
                    @context-selected=${e => {
                      link.address = e.detail.contextId;
                      link.name = e.detail.contextName;
                      this.requestUpdate();
                    }}
                  ></context-selector>
                `
              : html`
                  ${link.name}
                `}
          </div>
          <div slot="details">
            ${link.address ? this.renderChild(link) : html``}
          </div>
        </details-toggle>
      </div>
    `;
  }

  protected firstUpdated() {
    this.loadCheckout();
  }

  update(changedProperties) {
    // Don't forget this or your element won't render!
    super.update(changedProperties);
    if (changedProperties.get('checkoutId')) {
      this.showContextManager = false;
      this.editing = false;
      this.loadCheckout();
    }
  }

  toggleEditing() {
    this.editing = !this.editing;
    if (this.editing) {
      this.backupObject = _.cloneDeep(this.commitObject);
    } else {
      this.commitObject = this.backupObject;
    }
    this.requestUpdate();
  }

  loadCheckout() {
    this.loading = true;
    this.requestUpdate();

    store.dispatch(getCheckoutAndContent(this.checkoutId)).then(() => {
      const state: VersionControlState = selectVersionControl(<RootState>(
        store.getState()
      ));

      this.contextId = selectContextIdFromCheckout(this.checkoutId)(state);
      this.branches = selectContextBranches(this.checkoutId)(state);
      this.checkoutObject(this.checkoutId);

      this.checkoutBranchId = selectBranchIdFromCheckout(this.checkoutId)(
        state
      );
      this.checkoutCommitId = selectBranchById(this.checkoutBranchId)(
        state
      ).branch_head;
      this.loading = false;
    });
  }

  checkoutObject(checkoutId: string) {
    this.loadingContent = true;

    return store.dispatch(getCheckoutAndContent(this.checkoutId)).then(() => {
      const state: VersionControlState = selectVersionControl(<RootState>(
        store.getState()
      ));

      this.commitObject = selectObjectFromCheckout(checkoutId)(state);
      this.selectEntry(this.commitObject.data);
    });
  }

  checkoutBranch(branchId: string) {
    this.checkoutObject(branchId);
    this.dispatchEvent(
      new CustomEvent('checkout-branch', {
        detail: {
          branchId: branchId
        }
      })
    );
    this.checkoutCommitId = selectBranchById(this.checkoutBranchId)(
      selectVersionControl(<RootState>store.getState())
    ).branch_head;

    this.checkoutBranchId = branchId;
  }

  checkoutCommit(commitId: string) {
    const branch = this.branches.find(
      branch => branch.branch_head === commitId
    );
    this.checkoutBranchId = branch ? branch.id : null;
    this.checkoutCommitId = commitId;

    this.checkoutObject(commitId);

    this.dispatchEvent(
      new CustomEvent('checkout-commit', {
        detail: {
          commitId: commitId
        }
      })
    );
  }

  selectEntry(entryId: string) {
    this.selectedEntryId = null;

    if (entryId) {
      this.loadContent(entryId).then(() => {
        this.selectedEntryId = entryId;
        this.dispatchEvent(
          new CustomEvent('entry-selected', {
            detail: {
              entryId: entryId
            }
          })
        );
        this.loadingContent = false;
      });
    }
  }

  createEmptyChild() {
    this.commitObject.links.push({ name: '', address: '' });
    this.requestUpdate();
  }

  commitChanges() {
    this.loading = true;

    this.saveContent(this.checkoutBranchId, this.commitObject.links).then(
      () => {
        this.editing = false;
        this.loading = false;
        this.loadCheckout();
      }
    );
  }

  createBranch(branchName: string) {
    this.loading = true;

    store
      .dispatch(
        createBranch.create({
          commit_address: this.checkoutCommitId,
          name: branchName
        })
      )
      .then(() => {
        this.loading = false;
        this.loadCheckout();
      });
  }
}
