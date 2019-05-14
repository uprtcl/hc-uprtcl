import { LinkResolver } from '../../services/resolver';
import { DocumentNode } from '../types';

export interface DocumentsService extends LinkResolver {
  getDocumentNode(nodeId: string): Promise<DocumentNode>;

  createDocumentNode(node: DocumentNode): Promise<string>;
  storeDocumentNodeDraft(nodeId: string, node: DocumentNode): Promise<void>;
}
