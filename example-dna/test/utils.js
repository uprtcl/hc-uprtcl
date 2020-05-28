const parseResponse = function (response) {
  return response.Ok ? response.Ok : response;
};

const getEntry = function (address) {
  return async (caller) => {
    const entry = await caller.call("uprtcl", "uprtcl", "get_entry", {
      entry_address: address,
    });
    return parseEntry(entry);
  };
};

/** Basic functions which call the zome */

/** Perspective */

const createPerspective = function (timestamp = Date.now()) {
  return async (caller) =>
    parseResponse(
      await caller.call("uprtcl", "uprtcl", "create_perspective", {
        timestamp,
      })
    );
};

const getContextPerspectives = function (context) {
  return async (caller) => {
    const perspectives = await caller.call(
      "uprtcl",
      "uprtcl",
      "get_context_perspectives",
      {
        context,
      }
    );
    return parseResponse(perspectives);
  };
};

const getPerspectiveDetails = function (perspectiveAddress) {
  return async (caller) => {
    const head = await caller.call(
      "uprtcl",
      "uprtcl",
      "get_perspective_details",
      {
        perspective_address: perspectiveAddress,
      }
    );
    return parseResponse(head);
  };
};

const updatePerspectiveDetails = function (perspectiveAddress, details) {
  return async (caller) =>
    await caller.call("uprtcl", "uprtcl", "update_perspective_details", {
      perspective_address: perspectiveAddress,
      details,
    });
};

/** Commits */

const createCommit = function (
  dataAddress,
  parentCommitAddresses = [],
  message = "",
  timestamp = Date.now()
) {
  return async (caller) =>
    parseResponse(
      await caller.call("uprtcl", "uprtcl", "create_commit", {
        dataId: dataAddress,
        parentsIds: parentCommitAddresses,
        message,
        timestamp,
      })
    );
};

/** Helper functions */

const createCommitInPerspective = function (
  perspectiveAddress,
  message,
  contentAddress
) {
  return async (caller) => {
    const { head: headAddress } = await getPerspectiveDetails(
      perspectiveAddress
    )(caller);

    const commitAddress = await createCommit(
      contentAddress,
      [headAddress],
      message
    )(caller);

    await updatePerspectiveDetails(perspectiveAddress, { head: commitAddress })(
      caller
    );
    return commitAddress;
  };
};

const createNewPerspectiveAndCommit = function (
  message,
  contentAddress,
  perspectiveName
) {
  return async (caller) => {
    const commitAddress = await createCommit(
      contentAddress,
      [],
      message
    )(caller);

    // Create another perspective pointing to the initial commit
    const perspectiveAddress = await createPerspective()(caller);
    let context = Math.random().toString();

    await updatePerspectiveDetails(perspectiveAddress, {
      head: commitAddress,
      context,
      name: perspectiveName,
    })(caller);

    return {
      context,
      commitAddress,
      perspectiveAddress,
    };
  };
};

/** Helper builders */

const buildPerspective = function (name, creatorId = CREATOR_ADDRESS) {
  return {
    name: name,
    origin: "holochain://",
    timestamp: Date.now(),
    creatorId: creatorId,
  };
};

const buildCommit = function (
  contentAddress,
  message = "",
  parentCommitAddresses = [],
  timestamp = Date.now()
) {
  return {
    creatorId: CREATOR_ADDRESS,
    timestamp: timestamp,
    message: message,
    dataId: contentAddress,
    parentsIds: parentCommitAddresses,
  };
};

const buildProvenance = function (address, signature) {
  return [address, signature];
};

const chain = async function (caller, ...actions) {
  var last = {};
  var all = [];

  for (const action of actions) {
    last = await action(last, all)(caller);
    if (last.Ok) last = last.Ok;
    all.push(last);
  }

  return {
    last: last,
    all: all,
  };
};

const parseEntriesResult = function (entries) {
  return parseResponse(entries).map((e) => parseEntryResult(e));
};

const parseEntryResult = function (entry) {
  let parseable = parseResponse(entry);
  return {
    ...parseEntry(parseable.result.Single.entry),
    id: parseable.result.Single.meta.address,
  };
};

const parseEntry = function (entry) {
  const parseable = parseResponse(entry);
  return JSON.parse(parseable.App[1]);
};

module.exports = {
  getEntry,
  createPerspective,
  getContextPerspectives,
  getPerspectiveDetails,
  updatePerspectiveDetails,
  createCommit,
  createCommitInPerspective,
  createNewPerspectiveAndCommit,
  buildPerspective,
  buildCommit,
  buildProvenance,
  chain,
  parseEntryResult,
  parseEntry,
};
