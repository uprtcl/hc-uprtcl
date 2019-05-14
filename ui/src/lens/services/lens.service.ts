import { Lens } from '../types';

export interface LensService {

  getLens(contentAddress: string, schema: string): Promise<Lens>;
  getAvailableLenses(schema: string): Promise<Lens[]>;

  setLens(contentAddress: string, lens: Lens): Promise<void>;
  setSchemaLens(schema: string, lens: Lens): Promise<void>;
  setGlobalSchemaLens(schema: string, lens: Lens): Promise<void>;

  setAvailableLenses(schema: string, lenses: Lens[]): Promise<void>;
}