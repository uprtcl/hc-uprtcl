import { HolochainConnection } from '../../services/holochain.connection';
import { Draft } from '../types';
import { DraftsService } from './drafts.service';

export class DraftsHolochain implements DraftsService {
  draftZome: HolochainConnection;

  constructor() {
    this.draftZome = new HolochainConnection('test-instance', 'draft');
  }

  getDraft(perspectiveId: string): Promise<Draft> {
    return this.draftZome.call('get_draft', {
      entry_address: perspectiveId
    });
  }
  
  setDraft(draft: Draft): Promise<void> {
    return this.draftZome.call('set_draft', {
      entry_address: draft.perspectiveId,
      draft: {
        data_link: draft.dataLink
      }
    });
  }
}
