import { LitElement, html, customElement, property } from 'lit-element';
import { Branch } from '../types';
import '@vaadin/vaadin-select/theme/material/vaadin-select.js';
import '@vaadin/vaadin-list-box/theme/material/vaadin-list-box.js';
import '@vaadin/vaadin-item/theme/material/vaadin-item.js';

@customElement('branch-selector')
export class BranchSelector extends LitElement {
  @property({ type: Array })
  public branches: Branch[];

  @property({ type: String })
  public selectedBranchId: string;

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
}
