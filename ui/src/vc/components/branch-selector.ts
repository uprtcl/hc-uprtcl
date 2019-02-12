import { LitElement, html, customElement, property } from 'lit-element';
import { Branch } from '../types';

@customElement('branch-selector')
export class BranchSelector extends LitElement {
  @property({ type: Array })
  public branches: Array<Branch>;

  render() {
    return html`
      <select @change="${this.branchSelected}">
        ${this.branches.map(
          branch =>
            html`
              <option value="${branch.id}">${branch.name}</option>
            `
        )}
      </select>
    `;
  }

  branchSelected(changeEvent) {
    const event = new CustomEvent('branch-selected', {
      detail: { branchId: changeEvent.target.value }
    });
    this.dispatchEvent(event);
  }
}
