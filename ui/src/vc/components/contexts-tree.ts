import { customElement, LitElement, html, property } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store } from '../../store';
import { Context, CommitObject } from '../types';
import { getChildrenContexts } from '../state/actions';

@customElement('contexts-tree')
export class ContextsTree extends connect(store)(LitElement) {
  @property({ type: String })
  public rootContextId: string;

  @property({ type: Object })
  rootContext: Context;

  @property({ type: Object })
  rootObject: CommitObject;

  @property({ type: Object })
  childContexts: { [key: string]: Context };

  @property({ type: Boolean })
  loading = true;

  render() {
    return html``;
  }

  protected firstUpdated() {
    this.loadChildren();
  }

  loadChildren() {
    this.loading = true;

    store
      .dispatch(getChildrenContexts(this.rootContextId))
      .then(() => (this.loading = false));
  }
}
