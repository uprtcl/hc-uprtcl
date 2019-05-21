export interface Context {
  id?: string;
  creatorId: string;
  timestamp: number;
  nonce: number;
}

export interface Perspective {
  id: string;
  creatorId: string;
  timestamp: number;
  contextId: string;
  name: string;
  headLink: string;
}

export interface Commit {
  id?: string;
  creatorId: string;
  timestamp: number;
  message: string;
  parentsLinks: Array<string>;
  dataLink: string;
}
