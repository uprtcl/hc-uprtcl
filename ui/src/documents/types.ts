export interface Position {
  before?: string;
  after: string;
}

export interface TextNode {
  id?: string;

  text: string;
  links: Array<string>;
}
