import { LitElement, html, customElement, property } from 'lit-element';
import { Branch } from '../types';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from '../../store';
import {
  selectContextBranches,
  selectVersionControl
} from '../state/selectors';
import { getContextBranchesInfo } from '../state/actions';

@customElement('branch-selector')
export class BranchSelector extends connect(store)(LitElement) {
  @property({ type: String })
  public contextId: string;

  @property({ type: Array })
  branches: Branch[];

  @property({ type: Boolean })
  loading = true;

  render() {
    return html`
      ${this.loading
        ? html`
            <span>Loading branches...</span>
          `
        : html`
            <select @change="${this.branchSelected}">
              ${this.branches.map(
                branch =>
                  html`
                    <option value="${branch.id}">${branch.name}</option>
                  `
              )}
            </select>
          `}
    `;
  }

  protected firstUpdated() {
    getContextBranchesInfo(store, this.contextId);
  }
  
  update(changedProperties) {
    // Don't forget this or your element won't render!
    super.update(changedProperties);
    if (changedProperties.get('contextId')) {
      this.loading = true;
      getContextBranchesInfo(store, this.contextId);
    }
  }  

  stateChanged(state: RootState) {
    const branches = selectContextBranches(this.contextId)(
      selectVersionControl(state)
    );

    if (branches != this.branches && branches.length > 0 && this.loading) {
      this.branches = branches;
      this.loading = false;
      this.dispatchBranchSelected(this.branches[0].id);
    }
  }

  branchSelected(changeEvent) {
    this.dispatchBranchSelected(changeEvent.target.value);
  }

  dispatchBranchSelected(branchId: string) {
    const event = new CustomEvent('branch-selected', {
      detail: { branchId: branchId }
    });
    this.dispatchEvent(event);
  }
}
