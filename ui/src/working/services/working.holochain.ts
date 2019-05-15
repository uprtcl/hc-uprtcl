import { HolochainConnection } from '../../services/holochain.connection';
import { Working } from '../types';
import { WorkingService } from './working.service';

export class WorkingHolochain implements WorkingService {
  workingZome: HolochainConnection;

  constructor() {
    this.workingZome = new HolochainConnection('test-instance', 'draft');
  }

  getWorking(perspectiveId: string): Promise<Working> {
    return this.workingZome.call('get_draft', {
      entry_address: perspectiveId
    });
  }

  setWorking(working: Working): Promise<void> {
    return this.workingZome.call('set_draft', {
      entry_address: working.perspectiveId,
      draft: {
        data_link: working.dataLink
      }
    });
  }
}
