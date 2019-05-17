export type FieldRelation = { [oldKey: string]: string };

export type ObjectRelation = {
  [objectType: string]: FieldRelation;
};

export class ConnectionFormatter {
  uiToServerRelation: ObjectRelation;

  constructor(relation: ObjectRelation) {
    this.uiToServerRelation = relation;
  }

  formatUiToServer<T>(objectType: string, object: any): T {
    const relation = this.uiToServerRelation[objectType];
    return this.formatRelation(relation, object);
  }

  formatServerToUi<T>(objectType: string, object: any): T {
    const relation = this.uiToServerRelation[objectType];
    return this.formatRelation(this.invertRelation(relation), object);
  }

  private invertRelation(relation: FieldRelation): FieldRelation {
    const result = {};
    for (const key of Object.keys(relation)) {
      result[relation[key]] = key;
    }
    return result;
  }

  private formatRelation<T>(relation: FieldRelation, object: any): T {
    const relationKeys = Object.keys(relation);

    const result = {};

    for (const oldKey of Object.keys(object)) {
      if (relationKeys.includes(oldKey)) {
        const newKey = relation[oldKey];
        result[newKey] = object[oldKey];
      } else {
        result[oldKey] = object[oldKey];
      }
    }
    return <T>result;
  }
}
