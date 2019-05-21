
import { Perspective, Commit, Context } from '../types';
import { UprtclService } from './uprtcl.service';
import { ConnectionFormatter } from './connection-formatter';
import { HolochainConnection, EntryResult } from '../../services/holochain.connection';

export class UprtclHolochain implements UprtclService {
  uprtclZome: HolochainConnection;
  formatter: ConnectionFormatter;

  objectRelation = {
    context: {
      creatorId: 'creator'
    },
    perspective: {
      creatorId: 'creator',
      contextId: 'context_address',
      headId: 'head'
    },
    commit: {
      creatorId: 'creator',
      parentsIds: 'parent_commits_addresses',
      dataId: 'content_address'
    }
  };

  constructor() {
    this.uprtclZome = new HolochainConnection('test-instance', 'uprtcl');
    this.formatter = new ConnectionFormatter(this.objectRelation);
  }

  getEntry(entryId): Promise<EntryResult> {
    return this.uprtclZome
      .call('get_entry', { address: entryId })
      .then(entry => this.uprtclZome.parseEntryResult(entry));
  }

  getRootPerspective(): Promise<Perspective> {
    return this.uprtclZome
      .call('get_root_perspective', {})
      .then(result => this.uprtclZome.parseEntryResult(result).entry)
      .then(perspective =>
        this.formatter.formatServerToUi<Perspective>('perspective', perspective)
      );
  }

  getContextId(context: Context): Promise<string> {
    return this.uprtclZome.call(
      'get_context_address',
      this.formatter.formatUiToServer<Context>('context', context)
    );
  }

  getContext(contextId: string): Promise<Context> {
    return this.getEntry(contextId).then(result =>
      this.formatter.formatServerToUi<Context>('context', result.entry)
    );
  }

  getPerspective(perspectiveId: string): Promise<Perspective> {
    return Promise.all([
      this.getEntry(perspectiveId),
      this.uprtclZome.call('get_perspective_head', {
        perspective_address: perspectiveId
      })
    ]).then(([result, headAddress]: [EntryResult, string]) => {
      const perspective = result.entry;
      perspective.head = headAddress;
      return this.formatter.formatServerToUi<Perspective>(
        'perspective',
        perspective
      );
    });
  }

  getCommit(commitId: string): Promise<Commit> {
    return this.getEntry(commitId).then(result =>
      this.formatter.formatServerToUi<Commit>('commit', result.entry)
    );
  }

  getContextPerspectives(contextId: string): Promise<Perspective[]> {
    return this.uprtclZome
      .call('get_context_perspectives', {
        context_address: contextId
      })
      .then((perspectiveAddresses: { links: Array<{ address: string }> }) =>
        Promise.all(
          perspectiveAddresses.links.map(p => this.getPerspective(p.address))
        )
      );
  }

  createContext(timestamp: number, nonce: number): Promise<string> {
    return this.uprtclZome.call('create_context', {
      timestamp: timestamp,
      nonce: nonce
    });
  }

  createPerspective(
    contextId: string,
    name: string,
    timestamp: number,
    headId: string
  ): Promise<string> {
    return this.uprtclZome.call('create_perspective', {
      context_address: contextId,
      name: name,
      timestamp: timestamp,
      head: headId
    });
  }

  createCommit(
    timestamp: number,
    message: string,
    parentsIds: string[],
    dataId: string
  ): Promise<string> {
    return this.uprtclZome.call('create_commit', {
      message: message,
      timestamp: timestamp,
      parent_commits_addresses: parentsIds,
      content_address: dataId
    });
  }

  cloneContext(context: Context): Promise<string> {
    return this.uprtclZome.call('clone_context', {
      context
    });
  }

  clonePerspective(perspective: Perspective): Promise<string> {
    return this.uprtclZome.call('clone_perspective', {
      perspective
    });
  }

  cloneCommit(commit: Commit): Promise<string> {
    return this.uprtclZome.call('clone_commit', {
      commit
    });
  }

  updateHead(perspectiveId: string, commitId: string): Promise<void> {
    return this.uprtclZome.call('update_perspective_head', {
      perspective_address: perspectiveId,
      commit_address: commitId
    });
  }
}
