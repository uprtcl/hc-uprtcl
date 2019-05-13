import { connect } from '@holochain/hc-web-client';

// Auxiliar type for Holochain's get_entry call
export interface EntryResult<T = any> {
  entry: T;
  type: string;
}

export class HolochainConnection {
  connection: (funcName: string, params: any) => Promise<any>;

  constructor(instanceId: string, zome: string) {
    connect('ws://localhost:8080').then(({ callZome, close }) => {
      this.connection = (funcName: string, params: any) =>
        callZome(instanceId, zome, funcName)(params);
    });
  }

  public call(funcName: string, params: any): Promise<any> {
    return this.connection(funcName, params);
  }

  public parseEntry(entry) {
    return JSON.parse(entry.App[1]);
  }

  public parseEntryResult<T>(entry): EntryResult<T> {
    return {
      entry: {
        id: entry.result.Single.meta.address,
        ...this.parseEntry(entry.result.Single.entry)
      },
      type: entry.result.Single.meta.entry_type.App
    };
  }

  protected parseEntries(entryArray: Array<any>) {
    return entryArray.map(entry => this.parseEntry(entry));
  }

  protected parseEntriesResults<T>(
    entryArray: Array<any>
  ): Array<EntryResult<T>> {
    return entryArray.map(entry =>
      this.parseEntryResult(entry.Ok ? entry.Ok : entry)
    );
  }
}
