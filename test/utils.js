const CREATOR_ADDRESS =
  'HcScjwO9ji9633ZYxa6IYubHJHW6ctfoufv5eq4F7ZOxay8wR76FP4xeG9pY3ui';

const parseResponse = function(response) {
  return response.Ok ? response.Ok : response;
};

const getEntry = function(address) {
  return caller => {
    const entry = caller.call('proxy', 'get_proxied_entry', {
      address: address
    });
    return parseEntryResult(entry);
  };
};

/** Basic functions which call the zome */

/** Contexts */

const createContext = function(context, provenance) {
  return async caller =>
    parseResponse(
      await caller.callSync('uprtcl', 'create_context', {
        context,
        provenance
      })
    );
};

const getRootContextId = function() {
  return async caller => {
    const result = await caller.callSync('uprtcl', 'get_root_context_id', {});
    return parseResponse(result);
  };
};

/** Perspective */

const createPerspective = function(perspective, provenance) {
  return async caller =>
    parseResponse(
      await caller.callSync('uprtcl', 'create_perspective', {
        perspective,
        provenance
      })
    );
};

const getContextPerspectives = function(contextAddress) {
  return async caller => {
    const perspectives = await caller.callSync(
      'uprtcl',
      'get_context_perspectives',
      {
        context_address: contextAddress
      }
    );
    return parseEntriesResult(perspectives);
  };
};

const getPerspectiveHead = function(perspectiveAddress) {
  return async caller => {
    const head = await caller.callSync('uprtcl', 'get_perspective_head', {
      perspective_address: perspectiveAddress
    });
    return parseResponse(head);
  };
};

const updatePerspectiveHead = function(perspectiveAddress, headAddress) {
  return async caller =>
    await caller.callSync('uprtcl', 'update_perspective_head', {
      perspective_address: perspectiveAddress,
      head_address: headAddress
    });
};

/** Commits */

const createCommit = function(commit, provenance) {
  return async caller =>
    parseResponse(
      await caller.callSync('uprtcl', 'create_commit', {
        commit,
        provenance
      })
    );
};

/** Helper functions */

const createCommitInPerspective = function(
  perspectiveAddress,
  message,
  contentAddress
) {
  return async caller => {
    const headAddress = await getPerspectiveHead(perspectiveAddress)(caller);

    const commit = buildCommit(contentAddress, message, [headAddress]);
    const commitAddress = await createCommit(commit)(caller);

    await updatePerspectiveHead(perspectiveAddress, commitAddress)(caller);
    return commitAddress;
  };
};

const createContextPerspectiveAndCommit = function(
  message,
  contentAddress,
  perspectiveName
) {
  return async caller => {
    const context = buildContext();
    const contextAddress = await createContext(context)(caller);

    const commit = buildCommit(contentAddress, message, []);
    const commitAddress = await createCommit(commit)(caller);

    // Create another perspective pointing to the initial commit
    const perspective = buildPerspective(perspectiveName, contextAddress);
    const perspectiveAddress = await createPerspective(perspective)(caller);

    await updatePerspectiveHead(perspectiveAddress, commitAddress)(caller);
    return {
      commitAddress,
      contextAddress,
      perspectiveAddress
    };
  };
};

/** Helper builders */

const buildContext = function(
  creatorId = CREATOR_ADDRESS,
  nonce = 0,
  timestamp = Date.now()
) {
  return {
    creatorId: creatorId,
    timestamp: timestamp,
    nonce: nonce
  };
};

const buildPerspective = function(
  name,
  contextAddress,
  creatorId = CREATOR_ADDRESS
) {
  return {
    name: name,
    origin: 'holochain://',
    timestamp: Date.now(),
    creatorId: creatorId,
    contextId: contextAddress
  };
};

const buildCommit = function(
  contentAddress,
  message = '',
  parentCommitAddresses = [],
  timestamp = Date.now()
) {
  return {
    creatorId: CREATOR_ADDRESS,
    timestamp: timestamp,
    message: message,
    dataId: contentAddress,
    parentIds: parentCommitAddresses
  };
};

const buildProvenance = function(address, signature) {
  return [address, signature];
};

const chain = async function(caller, ...actions) {
  var last = {};
  var all = [];

  for (const action of actions) {
    last = await action(last, all)(caller);
    if (last.Ok) last = last.Ok;
    all.push(last);
  }

  return {
    last: last,
    all: all
  };
};

const parseEntriesResult = function(entries) {
  return parseResponse(entries).map(e => parseEntryResult(e));
};

const parseEntryResult = function(entry) {
  let parseable = parseResponse(entry);
  return {
    ...parseEntry(parseable.result.Single.entry),
    id: parseable.result.Single.meta.address
  };
};

const parseEntry = function(entry) {
  const parseable = parseResponse(entry);
  return JSON.parse(parseable.App[1]);
};

module.exports = {
  getEntry,
  createContext,
  createPerspective,
  getRootContextId,
  getContextPerspectives,
  getPerspectiveHead,
  updatePerspectiveHead,
  createCommit,
  createCommitInPerspective,
  createContextPerspectiveAndCommit,
  buildContext,
  buildPerspective,
  buildCommit,
  buildProvenance,
  chain,
  parseEntryResult,
  parseEntry,
  CREATOR_ADDRESS
};
