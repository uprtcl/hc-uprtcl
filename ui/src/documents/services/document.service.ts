import { TextNode } from '../types';

export interface DocumentsService {
  getTextNode(nodeId: string): Promise<TextNode>;

  createTextNode(node: TextNode): Promise<string>;
}
