import { DocumentsService } from './documents.service';
import { HolochainConnection } from '../../services/holochain.connection';
import { DocumentNode } from '../types';

export class HolochainDocuments implements DocumentsService {
  draftsZome: HolochainConnection;
  documentsZome: HolochainConnection;

  constructor() {
    this.draftsZome = new HolochainConnection('test-instance', 'draft');
    this.documentsZome = new HolochainConnection('test-instance', 'documents');
  }

  async getDocumentNode(nodeId: string): Promise<DocumentNode> {
    try {
      const draft = await this.draftsZome.call('get_draft', {
        address: nodeId
      });
      return <DocumentNode>JSON.parse(draft);
    } catch (err) {
      return await this.documentsZome
        .call('get_document_node', {
          address: nodeId
        })
        .then(
          result =>
            this.documentsZome.parseEntryResult<DocumentNode>(result).entry
        );
    }
  }

  createDocumentNode(node: DocumentNode): Promise<string> {
    return this.documentsZome.call('create_document_node', node);
  }

  storeDocumentNodeDraft(nodeId: string, node: DocumentNode): Promise<void> {
    return this.documentsZome.call('set_draft', {
      entry_address: nodeId,
      draft: JSON.stringify(node)
    });
  }

  resolve(link: string): Promise<any> {
    return this.getDocumentNode(link);
  }
}
