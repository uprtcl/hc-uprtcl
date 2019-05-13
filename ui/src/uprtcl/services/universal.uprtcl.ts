import { UprtclResolver } from './uprtcl.resolver';
import { Context, Perspective, Commit } from '../types';
import { HolochainUprtcl } from './holochain.uprtcl';

export class UniversalUprtcl implements UprtclResolver {
  holochainUprtcl = new HolochainUprtcl();

  getRootContext(): Promise<Context> {
    return this.holochainUprtcl.getRootContext();
  }
  getContext(contextId: any): Promise<Context> {
    return this.holochainUprtcl.getContext(contextId);
  }
  getPerspective(perspectiveId: any): Promise<Perspective> {
    return this.holochainUprtcl.getPerspective(perspectiveId);
  }
  getCommit(commitId: any): Promise<Commit> {
    return this.holochainUprtcl.getCommit(commitId);
  }
  getContextPerspectives(contextId: any): Promise<Perspective[]> {
    return this.holochainUprtcl.getContextPerspectives(contextId);
  }
  createContext(): Promise<string> {
    return this.holochainUprtcl.createContext();
  }
  createPerspective(
    contextId: string,
    commitId: string,
    name: string
  ): Promise<string> {
    return this.holochainUprtcl.createPerspective(contextId, commitId, name);
  }
  createCommit(
    perspectiveId: string,
    message: string,
    contentAddress: string
  ): Promise<string> {
    return this.holochainUprtcl.createCommit(
      perspectiveId,
      message,
      contentAddress
    );
  }
}
