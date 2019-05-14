import { DocumentsService } from './document.service';
import { HolochainConnection } from '../../services/holochain.connection';
import { TextNode } from '../types';

export class HolochainDocuments implements DocumentsService {
  draftsZome: HolochainConnection;
  documentsZome: HolochainConnection;

  constructor() {
    this.draftsZome = new HolochainConnection('test-instance', 'draft');
    this.documentsZome = new HolochainConnection('test-instance', 'documents');
  }

  async getTextNode(nodeId: string): Promise<TextNode> {
    try {
      const draft = await this.draftsZome.call('get_draft', {
        address: nodeId
      });
      return <TextNode>JSON.parse(draft);
    } catch (err) {
      return await this.documentsZome
        .call('get_text_node', {
          address: nodeId
        })
        .then(
          result => this.documentsZome.parseEntryResult<TextNode>(result).entry
        );
    }
  }

  createTextNode(node: TextNode): Promise<string> {
    return this.documentsZome.call('create_text_node', node);
  }

  storeTextNodeDraft(nodeId: string, node: TextNode): Promise<void> {
    return this.documentsZome.call('set_draft', {
      entry_address: nodeId,
      draft: JSON.stringify(node)
    });
  }

  resolve(link: string): Promise<any> {
    return this.getTextNode(link);
  }
}
