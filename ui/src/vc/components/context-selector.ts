import { customElement, LitElement, property, html } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from '../../store';
import { Context } from '../types';
import { adapters, selectVersionControl } from '../state/reducer';
import { selectContexts } from '../state/context/selectors';
import { getAllContexts } from '../state/context/actions';

import '@vaadin/vaadin-combo-box/theme/material/vaadin-combo-box.js';

@customElement('context-selector')
export class ContextSelector extends connect(store)(LitElement) {
  @property({ type: Array })
  public contexts: Array<Context>;

  @property({ type: Array })
  public filterIds: Array<string>;

  @property({ type: String })
  public selectedContextName: string;

  @property({ type: Boolean })
  loading = false;

  render() {
    return html`
      <vaadin-combo-box
        label="Select context"
        .items=${this.contexts.map((c: Context) => c.name)}
        .loading=${this.loading}
        .value=${this.selectedContextName}
        @open=${e => this.loadContexts()}
        @value-changed=${e => this.contextSelected(e.detail.value)}
      >
      </vaadin-combo-box>
    `;
  }

  stateChanged(state: RootState) {
    this.contexts = selectContexts(selectVersionControl(state)).filter(
      c => !this.filterIds.includes(c.id)
    );
  }

  loadContexts() {
    this.loading = true;
    store
      .dispatch(getAllContexts.create({}))
      .then(() => (this.loading = false));
  }

  contextSelected(contextName: string) {
    if (contextName) {
      this.dispatchEvent(
        new CustomEvent('context-selected', {
          detail: {
            contextId: this.contexts.find(c => c.name === contextName).id,
            contextName: contextName
          }
        })
      );
    }
  }
}
