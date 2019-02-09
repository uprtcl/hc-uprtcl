import * as _ from 'lodash';

export interface EntityState<T> {
  entities: { [key: string]: T };
  ids: Array<string>;
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
  entityState[id] = entity;
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

  entityState[id] = entity;
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

function removeEntity<T>(
  entityState: EntityState<T>,
  id: string
): EntityState<T> {
  delete entityState[id];
  entityState.ids.splice(entityState.ids.indexOf(id), 1);
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

export function createEntityAdapter<T>(
  idSelector: IdSelector<T> = defaultIdSelector
) {
  return {
    getInitialState,
    insertOne: (entity: T, entityState: EntityState<T>) =>
      insertOne(entityState, idSelector, entity),
    insertMany: (entities: T[], entityState: EntityState<T>) =>
      insertMany(entityState, idSelector, entities),
    upsertMany: (entities: T[], entityState: EntityState<T>) =>
      upsertMany(entityState, idSelector, entities),
    upsertOne: (entity: T, entityState: EntityState<T>) =>
      upsertOne(entityState, idSelector, entity),
    updateOne: (update: Update<T>, entityState: EntityState<T>) =>
      updateOne(entityState, update),
    removeOne: (id: string, entityState: EntityState<T>) =>
      removeEntity(entityState, id)
  };
}
