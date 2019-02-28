import * as _ from 'lodash';

export interface EntityState<T> {
  entities: { [key: string]: T };
  ids: Array<string>;
}

export interface EntityAdapter<T> {
  getInitialState: () => EntityState<T>;
  insertOne: (entity: T, entityState: EntityState<T>) => EntityState<T>;
  insertMany: (entities: T[], entityState: EntityState<T>) => EntityState<T>;
  updateOne: (update: Update<T>, entityState: EntityState<T>) => EntityState<T>;
  updateMany: (
    updates: Array<Update<T>>,
    entityState: EntityState<T>
  ) => EntityState<T>;
  upsertOne: (entity: T, entityState: EntityState<T>) => EntityState<T>;
  upsertMany: (entities: T[], entityState: EntityState<T>) => EntityState<T>;
  removeOne: (id: string, entityState: EntityState<T>) => EntityState<T>;
  removeMany: (ids: string[], entityState: EntityState<T>) => EntityState<T>;
  selectIds: (entityState: EntityState<T>) => string[];
  selectEntities: (entityState: EntityState<T>) => { [key: string]: T };
  selectAll: (entityState: EntityState<T>) => Array<T>;
  selectById: (id: string) => (entityState: EntityState<T>) => T;
}

export interface Update<T> {
  id: string;
  changes: Partial<T>;
}

export type IdSelector<T> = (entity: T) => string;

function defaultIdSelector<T>(entity: T): string {
  return entity['id'];
}

function getInitialState() {
  return {
    entities: {},
    ids: []
  };
}

function insertOne<T>(
  entityState: EntityState<T>,
  idSelector: IdSelector<T>,
  entity: T
): EntityState<T> {
  const id = idSelector(entity);
  entityState.entities[id] = entity;
  entityState.ids.push(id);
  return entityState;
}

function insertMany<T>(
  entityState: EntityState<T>,
  idSelector: IdSelector<T>,
  entities: T[]
): EntityState<T> {
  entities.forEach(entity => {
    entityState = insertOne(entityState, idSelector, entity);
  });

  return entityState;
}

function upsertOne<T>(
  entityState: EntityState<T>,
  idSelector: IdSelector<T>,
  entity: T
): EntityState<T> {
  const id = idSelector(entity);

  if (!entityState.entities[id]) {
    entityState.ids.push(id);
  }

  entityState.entities[id] = entity;
  return entityState;
}

function upsertMany<T>(
  entityState: EntityState<T>,
  idSelector: IdSelector<T>,
  entities: T[]
): EntityState<T> {
  entities.forEach(entity => {
    entityState = upsertOne(entityState, idSelector, entity);
  });

  return entityState;
}

function removeOne<T>(entityState: EntityState<T>, id: string): EntityState<T> {
  delete entityState.entities[id];
  entityState.ids.splice(entityState.ids.indexOf(id), 1);
  return entityState;
}

function removeMany<T>(
  entityState: EntityState<T>,
  ids: string[]
): EntityState<T> {
  ids.forEach(id => {
    entityState = removeOne(entityState, id);
  });

  return entityState;
}

function updateOne<T>(
  entityState: EntityState<T>,
  update: Update<T>
): EntityState<T> {
  entityState.entities[update.id] = _.merge(
    entityState.entities[update.id],
    update.changes
  );
  return entityState;
}

function updateMany<T>(
  entityState: EntityState<T>,
  updates: Array<Update<T>>
): EntityState<T> {
  updates.forEach(update => {
    entityState = updateOne(entityState, update);
  });

  return entityState;
}

/**
 * Creates an adapter for the generic interface
 * @param idSelector
 */
export function createEntityAdapter<T>(
  idSelector: IdSelector<T> = defaultIdSelector
): EntityAdapter<T> {
  return {
    // Initial state
    getInitialState,
    // Actions
    insertOne: (entity: T, entityState: EntityState<T>) =>
      insertOne(entityState, idSelector, entity),
    insertMany: (entities: T[], entityState: EntityState<T>) =>
      insertMany(entityState, idSelector, entities),
    updateOne: (update: Update<T>, entityState: EntityState<T>) =>
      updateOne(entityState, update),
    updateMany: (updates: Array<Update<T>>, entityState: EntityState<T>) =>
      updateMany(entityState, updates),
    upsertOne: (entity: T, entityState: EntityState<T>) =>
      upsertOne(entityState, idSelector, entity),
    upsertMany: (entities: T[], entityState: EntityState<T>) =>
      upsertMany(entityState, idSelector, entities),
    removeOne: (id: string, entityState: EntityState<T>) =>
      removeOne(entityState, id),
    removeMany: (ids: string[], entityState: EntityState<T>) =>
      removeMany(entityState, ids),
    // Selectors
    selectIds: (entityState: EntityState<T>) => entityState.ids,
    selectEntities: (entityState: EntityState<T>) => entityState.entities,
    selectAll: (entityState: EntityState<T>) =>
      entityState.ids.map(id => entityState.entities[id]),
    selectById: (id: string) => (entityState: EntityState<T>) =>
      entityState.entities[id]
  };
}
