import { LitElement, customElement, property, html } from 'lit-element';
import { sharedStyles } from '../styles/styles';

@customElement('details-toggle')
export class DetailsToggle extends LitElement {
  @property({ type: Boolean })
  public detailsOpened = false;

  render() {
    return html`
      ${sharedStyles}
      <div class="column">
        <div class="row" style="align-items: center;">
          <vaadin-button
            theme="icon"
            @click="${e => (this.detailsOpened = !this.detailsOpened)}"
          >
            <iron-icon
              icon="${this.detailsOpened
                ? 'vaadin:angle-down'
                : 'vaadin:angle-right'}"
            ></iron-icon>
          </vaadin-button>

          <slot name="title"></slot>
        </div>

        ${this.detailsOpened
          ? html`
              <slot name="details"></slot>
            `
          : html``}
      </div>
    `;
  }
}
