import { LitElement, html, customElement, property } from 'lit-element';
import { Context } from '../types';

import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from '../../store';
import {
  getCreatedContextsAndContents,
  getCreatedContexts
} from '../state/actions';
import { selectContexts, selectVersionControl } from '../state/selectors';

@customElement('created-contexts')
export class CreatedContexts extends connect(store)(LitElement) {
  @property({ type: Array })
  contexts: Array<Context> = [];

  render() {
    return html`
      <div>
        ${this.contexts.map(
          context => html`
            <button @click="${e => this.contextSelected(context.id)}">
              ${context.name}
            </button>
          `
        )}
      </div>
    `;
  }

  protected firstUpdated() {
    store.dispatch(getCreatedContexts.create({}));
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
