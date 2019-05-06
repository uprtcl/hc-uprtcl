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

  render() {
    return this.loadingOrContent(
      () => html`
        <div style="display: flex; flex-direction: column;">
          <div style="display: flex; flex-direction: row;">

            <input @change=${e => (this.newFolderName = e.target.value)} />
            <button
              @click=${e => this.createFolder(this.newFolderName)}
              ?disabled=${!this.newFolderName}
            >
              Add folder
            </button>
          </div>
          <ul>
            ${Object.keys(this.folder.links).map(
              name => html`
                <li>${name}</li>
              `
            )}
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
      .then(childAddress => {
        this.folder.links[name] = childAddress;
        this.requestUpdate();

        store
          .dispatch(createFolder.create({ folder: this.folder }))
          .then(address =>
            this.dispatchEvent(
              new CustomEvent('content-created', {
                detail: { cid: address },
                bubbles: true,
                composed: true
              })
            )
          );
      });
  }
}
