import { LitElement, html, property, TemplateResult } from 'lit-element';
import '@vaadin/vaadin-button/theme/material/vaadin-button.js';
import '@vaadin/vaadin-details/theme/material/vaadin-details.js';
import '@vaadin/vaadin-icons/vaadin-icons.js';
import '@polymer/marked-element/marked-element.js';
import { connect } from 'pwa-helpers/connect-mixin.js';
import * as _ from 'lodash';

import { store, RootState } from '../../store';
import { CommitObject, Link } from '../types';
import { sharedStyles } from '../styles/styles';
import { getCheckout, getCheckoutAndContent } from '../state/checkout/actions';
import { selectObjectFromCheckout } from '../state/checkout/selectors';
import { selectVersionControl } from '../state/reducer';

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
  commiting = false;

  @property({ type: Boolean })
  showContextManager = false;

  checkoutBranchId: string;

  abstract renderContent(entryId: string): TemplateResult;
  abstract renderChild(childAddress: string): TemplateResult;
  abstract saveContent(): Promise<any>;

  render() {
    return html`
      ${sharedStyles}

      <div class="column fill">
        <div class="row fill">
          ${this.selectedEntryId
            ? this.renderContent(this.selectedEntryId)
            : html`
                <vaadin-progress-bar
                  indeterminate
                  value="0"
                ></vaadin-progress-bar>
              `}
          <div class="row" style="align-items: start;">
            ${this.rootContainer
              ? html`
                  ${this.editing
                    ? html`
                        <div class="column">
                          <vaadin-button
                            theme="icon"
                            @click="${this.commitObject}"
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
              @click=${e =>
                (this.showContextManager = !this.showContextManager)}
            >
              <iron-icon icon="vaadin:file-tree"></iron-icon>
            </vaadin-button>
          </div>

          ${this.showContextManager
            ? html`
                <context-manager
                  style="margin-right: 20px;"
                  .initialCheckoutId=${this.checkoutId}
                  @branch-checkout=${e =>
                    (this.checkoutBranchId = e.detail.branchId)}
                  @entry-selected=${e =>
                    (this.selectedEntryId = e.detail.entryId)}
                ></context-manager>
              `
            : html``}
        </div>

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

                  <vaadin-text-field
                    .value=${link.name}
                    @keyup=${e => (link.name = e.target.value)}
                  ></vaadin-text-field>
                </div>
              `
            : html`
                ${link.name}
              `}
        </div>
        ${link.address
          ? this.renderChild(link.address)
          : html`
              hello
            `}
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
    store.dispatch(getCheckout(this.checkoutId)).then(() =>
      store.dispatch(getCheckoutAndContent(this.checkoutId)).then(() => {
        this.commitObject = selectObjectFromCheckout(this.checkoutId)(
          selectVersionControl(<RootState>store.getState())
        );
        this.selectedEntryId = this.commitObject.data;
      })
    );
  }

  createEmptyChild() {
    this.commitObject.links.push({ name: '', address: '' });
    this.requestUpdate();
  }

  commitChanges() {
    this.commiting = true;

    this.saveContent().then(() => {
      this.commiting = false;
      const aux = this.checkoutId;
      this.checkoutId = null;
      setTimeout(() => (this.checkoutId = aux));
    });
  }
}
