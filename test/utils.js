const CREATOR_ADDRESS =
  'HcScjwO9ji9633ZYxa6IYubHJHW6ctfoufv5eq4F7ZOxay8wR76FP4xeG9pY3ui';

const parseResponse = function(response) {
  return response.Ok ? response.Ok : response;
};

const getEntry = function(address) {
  return async caller => {
    const entry = await caller.call('uprtcl', 'proxy', 'get_proxied_entry', {
      address: address
    });
    return parseEntryResult(entry);
  };
};

/** Basic functions which call the zome */

/** Contexts */

const createContext = function(timestamp = Date.now(), nonce = 0) {
  return async caller =>
    parseResponse(
      await caller.call('uprtcl', 'uprtcl', 'create_context', {
        timestamp,
        nonce
      })
    );
};

/** Perspective */

const createPerspective = function(name, timestamp = Date.now()) {
  return async caller =>
    parseResponse(
      await caller.call('uprtcl', 'uprtcl', 'create_perspective', {
        name,
        timestamp
      })
    );
};

const getContextPerspectives = function(contextAddress) {
  return async caller => {
    const perspectives = await caller.call('uprtcl', 
      'uprtcl',
      'get_context_perspectives',
      {
        context_address: contextAddress
      }
    );
    return parseResponse(perspectives);
  };
};

const getPerspectiveHead = function(perspectiveAddress) {
  return async caller => {
    const head = await caller.call('uprtcl', 'uprtcl', 'get_perspective_head', {
      perspective_address: perspectiveAddress
    });
    return parseResponse(head);
  };
};

const updatePerspectiveHead = function(perspectiveAddress, headAddress) {
  return async caller =>
    await caller.call('uprtcl', 'uprtcl', 'update_perspective_head', {
      perspective_address: perspectiveAddress,
      head_address: headAddress
    });
};

const updatePerspectiveContext = function(perspectiveAddress, contextAddress) {
  return async caller =>
    await caller.call('uprtcl', 'uprtcl', 'update_perspective_context', {
      perspective_address: perspectiveAddress,
      context_address: contextAddress
    });
};

/** Commits */

const createCommit = function(
  dataAddress,
  parentCommitAddresses = [],
  message = '',
  timestamp = Date.now()
) {
  return async caller =>
    parseResponse(
      await caller.call('uprtcl', 'uprtcl', 'create_commit', {
        dataId: dataAddress,
        parentsIds: parentCommitAddresses,
        message,
        timestamp
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

    const commitAddress = await createCommit(contentAddress, [headAddress], message)(caller);

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
    const contextAddress = await createContext()(caller);

    const commitAddress = await createCommit(contentAddress, [], message)(caller);

    // Create another perspective pointing to the initial commit
    const perspectiveAddress = await createPerspective(perspectiveName)(caller);

    await updatePerspectiveContext(perspectiveAddress, contextAddress)(caller);

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

const buildPerspective = function(name, creatorId = CREATOR_ADDRESS) {
  return {
    name: name,
    origin: 'holochain://',
    timestamp: Date.now(),
    creatorId: creatorId
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
    parentsIds: parentCommitAddresses
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
  getContextPerspectives,
  getPerspectiveHead,
  updatePerspectiveHead,
  updatePerspectiveContext,
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
