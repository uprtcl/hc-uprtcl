import { Commit, Perspective, Context } from '../types';

export interface UprtclService {
  /** Getters */
  /** CRUD getters */
  getContext(contextId: string): Promise<Context>;
  getPerspective(perspectiveId: string): Promise<Perspective>;
  getCommit(commitId: string): Promise<Commit>;

  /** special getters */
  getRootPerspective(): Promise<Perspective>;
  getContextId(context: Context): Promise<string>;
  getContextPerspectives(contextId: string): Promise<Perspective[]>;

  /** Modifiers */

  // Contexts
  /**
   * Creates the context if necessary and returns its ID
   */
  createContext(timestamp: number, nonce: number): Promise<string>;

  // Perspectives
  createPerspective(
    contextId: string,
    name: string,
    timestamp: number,
    headId: string
  ): Promise<string>;

  // Commit
  createCommit(
    timestamp: number,
    message: string,
    parentsIds: string[],
    dataId: string
  ): Promise<string>;

  cloneContext(context: Context): Promise<string>;
  clonePerspective(perspective: Perspective): Promise<string>;
  cloneCommit(commit: Commit): Promise<string>;

  updateHead(perspectiveId: string, commitId: string): Promise<void>;
}
