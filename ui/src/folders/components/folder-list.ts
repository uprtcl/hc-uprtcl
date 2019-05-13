import { LitElement, html, customElement, property } from 'lit-element';
import { Folder } from '../types';
import { store, RootState } from '../../store';
import { getFolder, createFolder } from '../state/actions';
import { connect } from 'pwa-helpers/connect-mixin';
import { selectFolder, selectFolders } from '../state/reducer';
import { ReduxLens } from '../../lens/components/redux-lens';

@customElement('folder-list')
export class FolderList extends ReduxLens(store) {
  @property()
  private folder: Folder;

  @property()
  private newFolderName: string;

  renderFolderList() {
    return html`
      ${Object.keys(this.folder.links).map(
        name => html`
          <a href="/perspective/${this.folder.links[name]}">
            <li>${name}</li>
          </a>
        `
      )}
    `;
  }

  render() {
    return this.loadingOrContent(
      () => html`
        <div style="display: flex; flex-direction: column;">
          <div
            style="display: flex; flex-direction: row; justify-content: flex-end;"
          >
            <input @change=${e => (this.newFolderName = e.target.value)} />
            <button
              @click=${e => this.createFolder(this.newFolderName)}
              ?disabled=${!this.newFolderName}
            >
              Add folder
            </button>
          </div>
          <ul>
            ${Object.keys(this.folder.links).length === 0
              ? html`
                  <span>This folder is empty</span>
                `
              : this.renderFolderList()}
          </ul>
        </div>
      `
    );
  }

  getLoadAction() {
    return getFolder.create({ address: this.cid });
  }

  stateChanged(state: RootState) {
    this.folder = selectFolder(this.cid)(selectFolders(state));
  }

  createFolder(name: string) {
    store
      .dispatch(createFolder.create({ folder: { name: name, links: {} } }))
      .then(folderAddress =>
        store
          .dispatch(
            createContextAndCommit.create({
              name: name,
              message: '',
              timestamp: Date.now(),
              content_address: folderAddress
            })
          )
          .then(response => {
            console.log(response)
            this.folder.links[name] = response.perspective_address;
            this.requestUpdate();

            store
              .dispatch(createFolder.create({ folder: this.folder }))
              .then(address =>
                this.dispatchEvent(
                  new CustomEvent('commit-content', {
                    detail: { cid: address },
                    bubbles: true,
                    composed: true
                  })
                )
              );
          })
      );
  }
}
