import { LitElement, html, customElement, property } from 'lit-element';
import { Note } from '../types';

@customElement('note-component')
export class NoteComponent extends LitElement {
  @property({ type: Object })
  note: Note;

  render() {
    return html`
      <div>
        <h3>${this.note.title}</h3>
        <span>${this.note.content}</span>
      </div>
    `;
  }
}
