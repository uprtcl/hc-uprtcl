export interface Context {
  id: string;
  name: string;
  date_created: string;
  created_by: string;
}

export interface Branch {
  id: string;
  name: string;
  context_address: string;

  branch_head: string;
}

export interface Commit {
  id: string;
  message: string;

  object_address: string;
  context_address: string;
  author_address: string;

  parent_commits_addresses: Array<string>;
}

export interface Object {
  data: string;
  subcontent: { [key: string]: string };
}

export function objectFromAddress(address: string): Object {
  return {
    data: address,
    subcontent: {}
  };
}
