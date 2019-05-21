import { connect } from '@holochain/hc-web-client';

// Auxiliar type for Holochain's get_entry call
export interface EntryResult<T = any> {
  entry: T;
  type: string;
}

export class HolochainConnection {
  connection: (funcName: string, params: any) => Promise<any>;
  connectionReady: Promise<any>;

  constructor(instanceId: string, zome: string) {
    this.connectionReady = connect('ws://localhost:8888').then(
      ({ callZome, close }) => {
        this.connection = async (funcName: string, params: any) =>
          await callZome(instanceId, zome, funcName)(params);
      }
    );
  }

  public async call(funcName: string, params: any): Promise<any> {
    await this.ready();
    console.log('[CALL ZOME FUNCTION]:', funcName, params);
    return this.connection(funcName, params)
      .then(jsonString => JSON.parse(jsonString))
      .then(result => {
        if (result.Err) throw new Error(JSON.stringify(result.Err));
        if (result.SerializationError) throw new Error(JSON.stringify(result.SerializationError));
        if (result.Ok) return result.Ok;
        console.log('[RESULT]:', result);
        return result;
      });
  }

  public ready(): Promise<void> {
    if (this.connection) return Promise.resolve();
    else return this.connectionReady;
  }

  public parseEntry(entry) {
    let parseable = entry.Ok ? entry.Ok : entry;
    return JSON.parse(parseable.App[1]);
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

  public parseEntries(entryArray: Array<any>) {
    return entryArray.map(entry => this.parseEntry(entry));
  }

  public parseEntriesResults<T>(entryArray: Array<any>): Array<EntryResult<T>> {
    return entryArray.map(entry =>
      this.parseEntryResult(entry.Ok ? entry.Ok : entry)
    );
  }
}
