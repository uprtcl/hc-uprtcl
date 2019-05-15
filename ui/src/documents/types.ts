export interface Position {
  before?: string;
  after: string;
}

export interface TextNode {
  id?: string;

  text: string;
  links: [
    {
      position?: Position;
      link: string;
    }
  ];
}
