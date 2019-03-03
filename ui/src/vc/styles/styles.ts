import { html } from 'lit-element';

export const sharedStyles = html`
  <style>
    .row {
      display: flex;
      flex-direction: row;
    }
    .column {
      display: flex;
      flex-direction: column;
    }
    .fill {
      flex-grow: 1;
    }
  </style>
`;
