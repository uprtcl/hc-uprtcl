import { connect } from '@holochain/hc-web-client';

export class HolochainConnection {
  connection: (funcName: string, params: any) => Promise<any>;

  constructor(instanceId: string, zome: string) {
    connect('ws://localhost:3000').then(({ callZome, close }) => {
      this.connection = (funcName: string, params: any) =>
        callZome(instanceId, zome, funcName)(params);
    });
  }

  public call(funcName: string, params: any): Promise<any> {
    return this.connection(funcName, params);
  }

  protected parseEntry(entry) {
    return JSON.parse(entry.App[1]);
  }

  protected parseEntryResult(entry) {
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

  protected parseEntriesResults(entryArray: Array<any>) {
    return entryArray.map(entry =>
      this.parseEntryResult(entry.Ok ? entry.Ok : entry)
    );
  }
}
