import {
  LitElement,
  html,
  customElement,
  property,
  PropertyValues
} from 'lit-element';
import { installRouter } from 'pwa-helpers/router.js';

import './uprtcl/components/uprtcl-root';
import { Perspective } from './uprtcl/types';
import { store, RootState } from './store';
import { connect } from 'pwa-helpers/connect-mixin';
import { getPerspective } from './uprtcl/state/perspective/actions';
import { selectPerspectiveById } from './uprtcl/state/perspective/selectors';
import { selectUprtcl } from './uprtcl/state/reducer';

@customElement('my-app')
export class MyApp extends connect(store)(LitElement) {
  @property()
  private checkoutPerspectiveId: string;

  @property()
  private perspective: Perspective;

  @property()
  private loading: boolean = false;

  constructor() {
    super();
    installRouter(location => this.handleNavigation(location));
  }

  render() {
    return html`
      ${this.checkoutPerspectiveId
        ? html`
            ${this.loading || !this.perspective
              ? html`
                  Loading...
                `
              : html`
                  <uprtcl-context
                    .cid=${this.perspective.context_address}
                  ></uprtcl-context>
                `}
          `
        : html`
            <uprtcl-root></uprtcl-root>
          `}
    `;
  }

  firstUpdated() {
    this.loadContent();
  }

  loadContent() {
    if (this.checkoutPerspectiveId) {
      this.loading = true;
      store.dispatch(getPerspective(this.checkoutPerspectiveId)).then(() => {
        this.stateChanged(<RootState>store.getState());
        this.loading = false;
      });
    }
  }

  stateChanged(state: RootState) {
    this.perspective = selectPerspectiveById(this.checkoutPerspectiveId)(
      selectUprtcl(state)
    );
    console.log(this.perspective);
  }

  handleNavigation(location: Location) {
    this.checkoutPerspectiveId = location.pathname.split('/')[2];
  }

  updated(changedProperties: PropertyValues) {
    // Don't forget this or your element won't render!
    super.updated(changedProperties);
    if (changedProperties.has('checkoutPerspectiveId')) {
      this.loadContent();
    }
  }
}
