export type Address = string;

export interface DocumentNode {
  id?: string;

  text: string;
  links: { [name: string]: Address };
}
