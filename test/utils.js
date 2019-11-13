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
      await caller.callSync('evees', 'clone_perspective', {
        previous_address: previousAddress,
        perspective
      })
    );
};

const getContextPerspectives = function(context) {
  return async caller => {
    const perspectives = await caller.callSync(
      'evees',
      'get_context_perspectives',
      {
        context
      }
    );
    return parseEntriesResult(perspectives);
  };
};

const getPerspectiveDetails = function(perspectiveAddress) {
  return async caller => {
    const head = await caller.callSync('evees', 'get_perspective_details', {
      perspective_address: perspectiveAddress
    });
    return parseResponse(head);
  };
};

const updatePerspectiveDetails = function(perspectiveAddress, details) {
  return async caller =>
    await caller.callSync('evees', 'update_perspective_details', {
      perspective_address: perspectiveAddress,
      details
    });
};

/** Commits */

const cloneCommit = function(commit, previousAddress = null) {
  const params = { commit };
  if (previousAddress) params['previous_address'] = previousAddress;

  return async caller =>
    parseResponse(await caller.callSync('evees', 'clone_commit', params));
};

/** Helper functions */

const createCommitInPerspective = function(
  perspectiveAddress,
  message,
  contentAddress
) {
  return async caller => {
    const { headId } = await getPerspectiveDetails(perspectiveAddress)(caller);

    const commitAddress = await cloneCommit(
      buildCommit(contentAddress, message, [headId])
    )(caller);

    await updatePerspectiveDetails(perspectiveAddress, {
      headId: commitAddress
    })(caller);
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

    const perspectiveAddress = await clonePerspective(buildPerspective())(
      caller
    );

    const context = 'context';
    await updatePerspectiveDetails(perspectiveAddress, {
      headId: commitAddress,
      name: perspectiveName,
      context
    })(caller);

    return {
      commitAddress,
      context,
      perspectiveAddress
    };
  };
};

/** Helper builders */

const buildPerspective = function(creatorId = CREATOR_ADDRESS) {
  return {
    payload: {
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
      creatorsIds: [CREATOR_ADDRESS],
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
  const result = await caller.callSync('evees', 'get_source_name', {});
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

  if (!parseable.result) return undefined;

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
  getPerspectiveDetails,
  updatePerspectiveDetails,
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
