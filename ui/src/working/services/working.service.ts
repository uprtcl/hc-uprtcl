import { Working } from '../types';

export interface WorkingService {
  getWorking(perspectiveId: string): Promise<Working>;

  setWorking(working: Working): Promise<void>;
}
