import { LinkResolver } from '../../services/resolver';
import { TextNode } from '../types';

export interface DocumentsService extends LinkResolver {
  getTextNode(nodeId: string): Promise<TextNode>;

  createTextNode(node: TextNode): Promise<string>;
  storeTextNodeDraft(nodeId: string, node: TextNode): Promise<void>;
}
