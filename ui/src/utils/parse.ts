export const parseEntry = entry => JSON.parse(entry.App[1]);

export const parseEntryResult = entry => ({
  entry: {
    id: entry.result.Single.meta.address,
    ...parseEntry(entry.result.Single.entry)
  },
  type: entry.result.Single.meta.entry_type.App
});

export const parseEntries = (entryArray: Array<any>) =>
  entryArray.map(entry => parseEntry(entry));

export const parseEntriesResults = (entryArray: Array<any>) =>
  entryArray.map(entry => parseEntryResult(entry.Ok ? entry.Ok : entry));
