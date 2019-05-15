export type Address = string;

export type Position = 
  | {
      before: Address;
      after: Address;
    }
  | {
      after: Address;
    }
export interface TextNode {
  id?: string;

  text: string;
  links: [
    {
      position?: Position;
      link: Address;
    }
  ];
}
