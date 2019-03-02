import { EntityState } from './utils/entity';

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

export interface CommitObject {
  id: string;

  data: string;
  links: Array<{ name: string; address: string }>;
}

/** History helpers types */

export type ChildrenCommit = Commit & { children_commits_addresses: string[] };

export type ContextHistory = EntityState<ChildrenCommit> & {
  originalCommitAddress: string;
};
