export interface Context {
  id: string;
  timestamp: string;
  creator: string;
}

export interface Perspective {
  id: string;
  name: string;
  context_address: string;

  head: string;
}

export interface Commit {
  id: string;
  message: string;

  content_address: string;
  context_address: string;
  creator: string;

  parent_commits_addresses: Array<string>;
}

// Auxiliar type for Holochain's get_entry call
export interface EntryResult<T = any> {
  entry: T;
  type: string;
}
