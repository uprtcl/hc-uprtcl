import { LitElement, html, customElement, property } from 'lit-element';
import { Context } from '../types';

import { connect } from 'pwa-helpers/connect-mixin';

import { store, RootState } from '../../store';
import { getCreatedContexts } from '../state/actions';
import { selectContexts, selectVersionControl } from '../state/selectors';

@customElement('created-contexts')
export class CreatedContexts extends connect(store)(LitElement) {
  @property({ type: Array })
  contexts: Array<Context> = [];

  @property({ type: Boolean })
  loading = true;

  render() {
    return html`
      <script type="module" src="@material/button/index.js"></script>

      <div style="display: flex; flex-direction: column;">
        ${!this.loading
          ? this.contexts.map(
              context => html`
                <button @click="${e => this.contextSelected(context.id)}">
                  ${context.name}
                </button>
              `
            )
          : html`
              <span>Loading created contexts...</span>
            `}
      </div>
    `;
  }

  protected firstUpdated() {
    store
      .dispatch(getCreatedContexts.create({}))
      .then(() => (this.loading = false));
  }

  stateChanged(state: RootState) {
    this.contexts = selectContexts(selectVersionControl(state));
  }

  contextSelected(contextId: string) {
    const event = new CustomEvent('context-selected', {
      detail: {
        contextId: contextId
      }
    });
    this.dispatchEvent(event);
  }
}
