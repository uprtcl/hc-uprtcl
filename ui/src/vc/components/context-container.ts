import { LitElement, html, property, TemplateResult } from 'lit-element';
import '@vaadin/vaadin-button/theme/material/vaadin-button.js';
import '@vaadin/vaadin-details/theme/material/vaadin-details.js';
import '@vaadin/vaadin-icons/vaadin-icons.js';
import '@polymer/marked-element/marked-element.js';
import { connect } from 'pwa-helpers/connect-mixin.js';
import * as _ from 'lodash';

import './context-selector';

import { store, RootState } from '../../store';
import { CommitObject, Link, Context } from '../types';
import { sharedStyles } from '../styles/styles';
import { getCheckout, getCheckoutAndContent } from '../state/checkout/actions';
import {
  selectObjectFromCheckout,
  selectContextIdFromCheckout,
  selectBranchIdFromCheckout
} from '../state/checkout/selectors';
import { selectVersionControl, VersionControlState } from '../state/reducer';

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

  @property({ type: String })
  selectedEntryId: string;

  @property({ type: Boolean })
  loading = true;

  @property({ type: Boolean })
  commiting = false;

  @property({ type: Boolean })
  showContextManager = false;

  checkoutBranchId: string;
  contextId: string;

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
      ${this.loadingIf(
        this.loading,
        () =>
          html`
            <div class="column fill">
              <div class="row fill">
                ${this.loadingIf(!this.selectedEntryId, () =>
                  this.renderContent(this.editing)
                )}
                ${this.renderToolbar()}
                ${this.showContextManager
                  ? html`
                      <context-manager
                        style="margin-right: 20px;"
                        .initialCheckoutId=${this.checkoutId}
                        @branch-checkout=${e =>
                          (this.checkoutBranchId = e.detail.branchId)}
                        @entry-selected=${e =>
                          this.selectEntry(e.detail.entryId)}
                      ></context-manager>
                    `
                  : html``}
              </div>

              ${this.renderChildren()}
            </div>
          `
      )}
    `;
  }

  renderToolbar(): TemplateResult {
    return html`
      <div class="row" style="align-items: start;">
        ${this.rootContainer
          ? html`
              ${this.editing
                ? html`
                    <div class="column">
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
                    </div>
                  `
                : html`
                    <vaadin-button
                      theme="icon"
                      @click=${e => this.toggleEditing()}
                    >
                      <iron-icon icon="vaadin:edit"></iron-icon>
                    </vaadin-button>
                  `}
            `
          : html``}

        <vaadin-button
          theme="icon"
          @click=${e => (this.showContextManager = !this.showContextManager)}
        >
          <iron-icon icon="vaadin:file-tree"></iron-icon>
        </vaadin-button>
      </div>
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
              <vaadin-button @click="${e => this.createEmptyChild()}">
                Add child
              </vaadin-button>
            `
          : html``}
      </div>
    `;
  }

  renderChildLink(link: Link, index: number): TemplateResult {
    return html`
      <vaadin-details theme="small">
        <div slot="summary">
          ${this.editing
            ? html`
                <div class="row">
                  <vaadin-button
                    theme="icon"
                    @click="${e => this.commitObject.links.splice(index, 1)}"
                  >
                    <iron-icon icon="vaadin:close"></iron-icon>
                  </vaadin-button>

                  <context-selector
                    .filterIds=${[this.contextId]}
                    @context-selected=${e => {
                      link.address = e.detail.contextId;
                      this.requestUpdate();
                    }}
                  ></context-selector>
                </div>
              `
            : html`
                ${link.name}
              `}
        </div>
        ${link.address ? this.renderChild(link) : html``}
      </vaadin-details>
    `;
  }

  protected firstUpdated() {
    this.loadCheckout();
  }

  update(changedProperties) {
    // Don't forget this or your element won't render!
    super.update(changedProperties);
    if (changedProperties.get('checkoutId')) {
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

    store.dispatch(getCheckout(this.checkoutId)).then(() =>
      store.dispatch(getCheckoutAndContent(this.checkoutId)).then(() => {
        const state: VersionControlState = selectVersionControl(<RootState>(
          store.getState()
        ));
        this.commitObject = selectObjectFromCheckout(this.checkoutId)(state);
        this.checkoutBranchId = selectBranchIdFromCheckout(this.checkoutId)(
          state
        );

        this.contextId = selectContextIdFromCheckout(this.checkoutId)(state);
        this.selectEntry(this.commitObject.data);
      })
    );
  }

  selectEntry(entryId: string) {
    this.selectedEntryId = null;

    this.loadContent(entryId).then(() => {
      this.selectedEntryId = entryId;
      this.dispatchEvent(
        new CustomEvent('entry-selected', {
          detail: {
            entryId: entryId
          }
        })
      );
      this.loading = false;
    });
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
}
