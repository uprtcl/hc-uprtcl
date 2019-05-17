import {
  HolochainConnection,
  EntryResult
} from '../../services/holochain.connection';
import { Perspective, Commit, Context } from '../types';
import { UprtclService } from './uprtcl.service';
import { LinkResolver } from '../../services/resolver';
import { ConnectionFormatter } from './connection-formatter';

export class UprtclHolochain implements UprtclService, LinkResolver {
  uprtclZome: HolochainConnection;
  formatter: ConnectionFormatter;

  objectRelation = {
    context: {
      creatorId: 'creator'
    },
    perspective: {
      creatorId: 'creator',
      contextId: 'context_address',
      headLink: 'head'
    },
    commit: {
      creatorId: 'creator',
      parentsLinks: 'parent_commits_links',
      dataLink: 'content_link'
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

  getRootContext(): Promise<Context> {
    return this.uprtclZome
      .call('get_root_context', {})
      .then(result => this.uprtclZome.parseEntryResult(result).entry)
      .then(context =>
        this.formatter.formatServerToUi<Context>('context', context)
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
      )
  }

  createContext(): Promise<string> {
    return this.uprtclZome.call('create_context', { timestamp: Date.now() });
  }

  createPerspective(
    contextId: string,
    name: string,
    headLink: string
  ): Promise<string> {
    return this.uprtclZome.call('create_perspective', {
      context_address: contextId,
      name: name,
      head_link: headLink
    });
  }

  createPerspectiveAndContent(
    context: Context,
    name: string,
    head: Commit
  ): Promise<string> {
    return this.uprtclZome.call('create_perspective_and_content', {
      context: this.formatter.formatUiToServer('context', context),
      name: name,
      head: this.formatter.formatUiToServer('commit', head)
    });
  }

  createCommit(
    perspectiveId: string,
    message: string,
    contentLink: string
  ): Promise<string> {
    return this.uprtclZome.call('create_commit', {
      perspective_address: perspectiveId,
      message: message,
      timestamp: Date.now(),
      content_link: contentLink
    });
  }

  resolve(link: string) {
    return this.getEntry(link).then(result => result.entry);
  }
}
