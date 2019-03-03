import { adapters } from '../reducer';
import { EntityState } from '../../utils/entity';

/**
 * Finds the entry with the given address within the given entity types
 */
export const selectExistingEntry = (
  entryId: string,
  entityTypes: string[]
) => state => {
  for (const entityType of entityTypes) {
    const entities: EntityState<any> = state[entityType];

    const entity = adapters[entityType].selectById(entryId)(entities);
    if (entity) {
      return {
        entry: entity,
        type: entityType
      };
    }
  }

  return null;
};
