import { Draft } from '../types';

export interface DraftsService {
  getDraft(perspectiveId: string): Promise<Draft>;

  setDraft(draft: Draft): Promise<void>;
}
