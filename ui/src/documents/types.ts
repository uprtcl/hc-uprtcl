export type Address = string;

export interface TextNode {
  id?: string;

  text: string;
  links: { [name: string]: Address };
}
