export const parseEntry = entry => JSON.parse(entry.App[1]);

export const parseEntryResult = entry => ({
  id: entry.result.Single.meta.address,
  ...parseEntry(entry.result.Single.entry)
});

export const parseEntries = (entryArray: Array<any>) =>
  entryArray.map(entry => parseEntry(entry));
  
export const parseEntriesResults = (entryArray: Array<any>) =>
  entryArray.map(entry => parseEntryResult(entry.Ok ? entry.Ok : entry));
