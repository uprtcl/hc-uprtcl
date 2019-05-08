import { Perspective, EntryResult, Commit } from '../uprtcl/types';
import { HolochainConnection } from './holochain.connection';
import { UprtclResolver } from './uprtcl.resolver';

export class HolochainResolver extends HolochainConnection
  implements UprtclResolver {
  constructor() {
    super('test-instance', 'uprtcl');
  }

  getEntry(entryId): Promise<EntryResult> {
    return this.call('get_entry', { address: entryId }).then(entry =>
      this.parseEntryResult(entry)
    );
  }

  getContext(contextId: string) {
    return this.getEntry(contextId).then(result => result.entry);
  }

  getPerspective(perspectiveId: string) {
    return this.getEntry(perspectiveId).then(result => result.entry);
  }

  getCommit(commitId: string) {
    return this.getEntry(commitId).then(result => result.entry);
  }

  getContextPerspectives(contextId: string) {
    return this.call('get_context_perspective', { context_address: contextId });
  }

  createContext(): Promise<string> {
    return this.call('create_context', { timestamp: Date.now() });
  }

  createPerspective(
    contextId: string,
    commitId: string,
    name: string
  ): Promise<string> {
    return this.call('create_perspective', {
      context_address: contextId,
      commit_address: commitId,
      name: name
    });
  }

  createCommit(
    perspectiveId: string,
    message: string,
    contentAddress: string
  ): Promise<string> {
    return this.call('create_commit', {
      perspective_address: perspectiveId,
      message: message,
      timestamp: Date.now(),
      content_address: contentAddress
    });
  }
}
