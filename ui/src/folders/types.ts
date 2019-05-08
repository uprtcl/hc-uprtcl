export type Address = string;

export interface Folder {
  id?: string;

  name: string;
  links: { [name: string]: Address };
}
