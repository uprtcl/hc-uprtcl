import { LitElement, html, customElement, property } from 'lit-element';
import { Branch } from '../types';
import '@vaadin/vaadin-select/theme/material/vaadin-select.js';
import '@vaadin/vaadin-list-box/theme/material/vaadin-list-box.js';
import '@vaadin/vaadin-text-field/theme/material/vaadin-text-field.js';
import '@vaadin/vaadin-item/theme/material/vaadin-item.js';

@customElement('branch-manager')
export class BranchManager extends LitElement {
  @property({ type: Array })
  public branches: Branch[];

  @property({ type: String })
  public selectedBranchId: string;

  @property({ type: String })
  newBranchName: string;

  render() {
    return html`
      <vaadin-select
        label="Select branch"
        value="${this.selectedBranchId}"
        @value-changed="${this.branchSelected}"
      >
        <template>
          <vaadin-list-box>
            ${this.branches.map(
              branch =>
                html`
                  <vaadin-item value="${branch.id}">${branch.name}</vaadin-item>
                `
            )}
          </vaadin-list-box>

          <hr style="margin: 0;">

          <vaadin-text-field
            style="margin-left: 8px;"
            label="New branch"
            @keyup=${e => (this.newBranchName = e.target.value)}
          ></vaadin-text-field>
          <vaadin-button
            theme="icon"
            ?disabled=${!this.newBranchName}
            @click=${this.createBranch}
          >
            <iron-icon icon="vaadin:new"></iron-icon>
          </vaadin-button>
        </template>
      </vaadin-select>
    `;
  }

  branchSelected(changeEvent) {
    const branchId = changeEvent.target.value;
    if (branchId && branchId !== 'null' && branchId !== this.selectedBranchId) {
      this.dispatchEvent(
        new CustomEvent('branch-selected', {
          detail: { branchId: changeEvent.target.value }
        })
      );
    }
  }

  createBranch(branchName: string) {
    this.dispatchEvent(
      new CustomEvent('create-branch', {
        detail: {
          branchName: branchName
        }
      })
    );
  }
}
