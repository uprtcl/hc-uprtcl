const CREATOR_ADDRESS =
  'HcScjwO9ji9633ZYxa6IYubHJHW6ctfoufv5eq4F7ZOxay8wR76FP4xeG9pY3ui';

const parseResponse = function(response) {
  return response.Ok ? response.Ok : response;
};

/** Basic functions which call the zome */

/** Contexts */

const createContext = function() {
  return async caller =>
    parseResponse(
      await caller.callSync('uprtcl', 'create_context', {
        timestamp: Date.now(),
        nonce: 0
      })
    );
};

const cloneContext = function(context) {
  return async caller =>
    parseResponse(
      await caller.callSync('uprtcl', 'clone_context', { context })
    );
};

const getContextInfo = function(contextAddress) {
  return caller => {
    const entry = caller.call('uprtcl', 'get_context_info', {
      context_address: contextAddress
    });
    return parseEntryResult(entry);
  };
};

const getRootContextId = function() {
  return async caller => {
    const result = await caller.callSync('uprtcl', 'get_root_context_id', {});
    return result;
  };
};

/** Perspective */

const createPerspective = function(contextAddress, name, commitAddress) {
  return async caller =>
    parseResponse(
      await caller.callSync('uprtcl', 'create_perspective', {
        context_address: contextAddress,
        name: name,
        timestamp: Date.now(),
        head_address: commitAddress
      })
    );
};

const clonePerspective = function(perspective) {
  return async caller =>
    parseResponse(
      await caller.callSync('uprtcl', 'clone_perspective', { perspective })
    );
};

const getContextPerspectives = function(contextAddress) {
  return caller =>
    parseEntriesResult(
      caller.call('uprtcl', 'get_context_perspectives', {
        context_address: contextAddress
      })
    );
};

const getPerspectiveInfo = function(perspectiveAddress) {
  return caller => {
    const entry = caller.call('uprtcl', 'get_perspective_info', {
      perspective_address: perspectiveAddress
    });
    return parseEntryResult(entry);
  };
};

const getPerspectiveHead = function(perspectiveAddress) {
  return caller =>
    parseResponse(
      caller.call('uprtcl', 'get_perspective_head', {
        perspective_address: perspectiveAddress
      })
    );
};

const updatePerspectiveHead = function(perspectiveAddress, headAddress) {
  return async caller =>
    await caller.callSync('uprtcl', 'update_perspective_head', {
      perspective_address: perspectiveAddress,
      head_address: headAddress
    });
};

/** Commits */

const createCommit = function(message, parentCommitsAddresses, contentAddress) {
  return async caller =>
    parseResponse(
      await caller.callSync('uprtcl', 'create_commit', {
        message: message,
        timestamp: Date.now(),
        parent_commits_addresses: parentCommitsAddresses,
        content_address: contentAddress
      })
    );
};

const cloneCommit = function(commit) {
  return async caller =>
    parseResponse(await caller.callSync('uprtcl', 'clone_commit', { commit }));
};

const getCommitInfo = function(commitAddress) {
  return caller => {
    const entry = caller.call('uprtcl', 'get_commit_info', {
      commit_address: commitAddress
    });
    return parseEntryResult(entry);
  };
};

/** Helper functions */

const createCommitInPerspective = function(
  perspectiveAddress,
  message,
  contentAddress
) {
  return async caller => {
    const headAddress = await getPerspectiveHead(perspectiveAddress)(caller);
    const commitAddress = await createCommit(
      message,
      [headAddress],
      contentAddress
    )(caller);
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
    const commitAddress = await createCommit(message, [], contentAddress)(
      caller
    );
    // Create another perspective pointing to the initial commit
    const perspectiveAddress = await createPerspective(
      contextAddress,
      perspectiveName,
      commitAddress
    )(caller);
    return {
      commitAddress,
      contextAddress,
      perspectiveAddress
    };
  };
};

/** Helper builders */

const buildContext = function(
  creator = CREATOR_ADDRESS,
  timestamp = Date.now(),
  nonce = 0
) {
  return {
    creator: creator,
    timestamp: timestamp,
    nonce: nonce
  };
};

const buildPerspective = function(contextAddress, creator = CREATOR_ADDRESS) {
  return {
    creator: creator,
    context_address: contextAddress
  };
};

const buildCommit = function(
  contentAddress,
  timestamp = Date.now(),
  message = '',
  parentCommitAddresses = []
) {
  return {
    creator: CREATOR_ADDRESS,
    timestamp: timestamp,
    message: message,
    content_address: contentAddress,
    parent_commits_addresses: parentCommitAddresses
  };
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
  getContextInfo,
  createContext,
  cloneContext,
  createPerspective,
  clonePerspective,
  getRootContextId,
  getContextPerspectives,
  getPerspectiveInfo,
  getPerspectiveHead,
  updatePerspectiveHead,
  createCommit,
  cloneCommit,
  getCommitInfo,
  createCommitInPerspective,
  createContextPerspectiveAndCommit,
  buildContext,
  buildPerspective,
  buildCommit,
  chain,
  parseEntryResult,
  parseEntry,
  CREATOR_ADDRESS
};
