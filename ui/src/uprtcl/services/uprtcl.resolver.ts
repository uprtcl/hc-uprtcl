import { Commit, Perspective, Context } from '../types';

export interface UprtclResolver {
  /** Getters */

  getRootContext(): Promise<Context>;
  getContext(contextId): Promise<Context>;
  getPerspective(perspectiveId): Promise<Perspective>;
  getCommit(commitId): Promise<Commit>;

  getContextPerspectives(contextId): Promise<Perspective[]>;

  /** Modifiers */

  createContext(): Promise<string>;
  createPerspective(
    contextId: string,
    commitId: string,
    name: string
  ): Promise<string>;
  createCommit(
    perspectiveId: string,
    message: string,
    contentAddress: string
  ): Promise<string>;
}
