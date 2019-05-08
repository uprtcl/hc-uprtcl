import { LitElement, html, property, TemplateResult } from 'lit-element';

/** From the id of the content to render and the viewer id */
export class BaseLens extends LitElement {
  @property()
  public cid: string;

  @property()
  protected loading: boolean = false;

  loadingOrContent(renderContent: () => TemplateResult) {
    return html`
      ${this.loading
        ? html`
            Loading...
          `
        : renderContent()}
    `;
  }

  loadContent() {}

  firstUpdated() {
    this.loadContent();
  }

  updated(changedProperties) {
    // Don't forget this or your element won't render!
    super.updated(changedProperties);
    if (changedProperties.has('cid')) {
      this.loadContent();
    }
  }
}
