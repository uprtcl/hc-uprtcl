const CREATOR_ADDRESS =
  'HcScjwO9ji9633ZYxa6IYubHJHW6ctfoufv5eq4F7ZOxay8wR76FP4xeG9pY3ui';

const parseResponse = function(response) {
  return response.Ok ? response.Ok : response;
};

const getEntry = function(address) {
  return async caller => {
    const entry = await caller.call('proxy', 'get_proxied_entry', {
      address: address
    });
    return parseEntryResult(entry);
  };
};

/** Basic functions which call the zome */

/** Perspective */

const clonePerspective = function(perspective, previousAddress = null) {
  return async caller =>
    parseResponse(
      await caller.callSync('uprtcl', 'clone_perspective', {
        previous_address: previousAddress,
        perspective
      })
    );
};

const getContextPerspectives = function(context) {
  return async caller => {
    const perspectives = await caller.callSync(
      'uprtcl',
      'get_context_perspectives',
      {
        context
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

const updatePerspectiveContext = function(perspectiveAddress, context) {
  return async caller =>
    await caller.callSync('uprtcl', 'update_perspective_context', {
      perspective_address: perspectiveAddress,
      context
    });
};

/** Commits */

const cloneCommit = function(commit, previousAddress = null) {
  const params = { commit };
  if (previousAddress) params['previous_address'] = previousAddress;

  return async caller =>
    parseResponse(await caller.callSync('uprtcl', 'clone_commit', params));
};

/** Helper functions */

const createCommitInPerspective = function(
  perspectiveAddress,
  message,
  contentAddress
) {
  return async caller => {
    const headAddress = await getPerspectiveHead(perspectiveAddress)(caller);

    const commitAddress = await cloneCommit(
      buildCommit(contentAddress, message, [headAddress])
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
    const commitAddress = await cloneCommit(
      buildCommit(contentAddress, message, [])
    )(caller);

    const perspectiveAddress = await clonePerspective(
      buildPerspective(perspectiveName)
    )(caller);

    const context = 'context';
    await updatePerspectiveContext(perspectiveAddress, context)(caller);

    await updatePerspectiveHead(perspectiveAddress, commitAddress)(caller);
    return {
      commitAddress,
      context,
      perspectiveAddress
    };
  };
};

/** Helper builders */

const buildPerspective = function(name, creatorId = CREATOR_ADDRESS) {
  return {
    payload: {
      name: name,
      origin: 'hc:uprtcl:example',
      timestamp: Date.now(),
      creatorId: creatorId
    },
    proof: buildProof()
  };
};

const buildCommit = function(
  contentAddress,
  message = '',
  parentCommitAddresses = [],
  timestamp = Date.now()
) {
  return {
    payload: {
      creatorId: CREATOR_ADDRESS,
      timestamp: timestamp,
      message: message,
      dataId: contentAddress,
      parentsIds: parentCommitAddresses
    },
    proof: buildProof()
  };
};

const buildProof = function(signature = '') {
  return {
    type: 'ECDSA',
    signature
  };
};

const getSourceName = async function(caller) {
  const result = await caller.callSync('uprtcl', 'get_source_name', {});
  return parseResponse(result);
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
  clonePerspective,
  getContextPerspectives,
  getPerspectiveHead,
  updatePerspectiveHead,
  updatePerspectiveContext,
  cloneCommit,
  createCommitInPerspective,
  createContextPerspectiveAndCommit,
  buildPerspective,
  buildCommit,
  buildProof,
  getSourceName,
  chain,
  parseEntryResult,
  parseEntry,
  CREATOR_ADDRESS
};
