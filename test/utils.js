/** Basic functions which call the zome */
const CREATOR_ADDRESS = 'QmdYFTXuTyuaXbyLAPHmemgkjsaVQ5tfpnLqY9on5JZmzR';

const getRootContext = function() {
  return async caller => await caller.call('uprtcl', 'get_root_context', {});
};

const createCommit = function(perspectiveAddress, message, contentAddress) {
  return async caller =>
    await caller.callSync('uprtcl', 'create_commit', {
      perspective_address: perspectiveAddress,
      message: message,
      timestamp: Date.now(),
      content_link: contentAddress
    });
};

const createPerspective = function(contextAddress, name, commitAddress) {
  return async caller =>
    await caller.callSync('uprtcl', 'create_perspective', {
      context_address: contextAddress,
      name: name,
      head_link: commitAddress
    });
};

const getPerspectiveHead = function(perspectiveAddress) {
  return caller =>
    caller.call('uprtcl', 'get_perspective_head', {
      perspective_address: perspectiveAddress
    });
};

const createContext = function() {
  return async caller =>
    await caller.callSync('uprtcl', 'create_context', {
      context: buildContext()
    });
};

const getContextPerspectives = function(contextAddress) {
  return caller =>
    caller.call('uprtcl', 'get_context_perspectives', {
      context_address: contextAddress
    });
};

const getCommitInfo = function(commitAddress) {
  return caller => {
    const entry = caller.call('uprtcl', 'get_commit_info', {
      commit_address: commitAddress
    });
    return parseEntryResult(entry);
  };
};

const getPerspectiveInfo = function(perspectiveAddress) {
  return caller => {
    const entry = caller.call('uprtcl', 'get_perspective_info', {
      perspective_address: perspectiveAddress
    });
    return parseEntryResult(entry);
  };
};

const mergePerspectives = function(
  fromPerspectiveAddress,
  toPerspectiveAddress
) {
  return async caller =>
    await caller.callSync('uprtcl', 'merge_perspectives', {
      from_perspective_address: fromPerspectiveAddress,
      to_perspective_address: toPerspectiveAddress
    });
};

const createPerspectiveAndContent = function(context, name, commit) {
  return async caller =>
    await caller.callSync('uprtcl', 'create_perspective_and_content', {
      context: context,
      name: name,
      head: commit
    });
};

/** Aggregation functions that call the basic zome functions */

const createNCommits = function(perspectiveAddress, message, commits) {
  return async caller => {
    var lastCommitAddress;
    for (var [index, commitContent] of commits.entries()) {
      lastCommitAddress = await createCommit(
        perspectiveAddress,
        message + index,
        commitContent
      )(caller);
    }
    return lastCommitAddress;
  };
};

const perspectiveAndMerge = function(originPerspectiveAddress, commitContent) {
  return async caller => {
    const { Ok: commitAddress } = getPerspectiveHead(originPerspectiveAddress)(
      caller
    );
    const { Ok: developAddress } = await createPerspective(
      commitAddress,
      'develop'
    )(caller);

    await createCommit(developAddress, 'develop commit', commitContent)(caller);

    return await mergePerspectives(developAddress, originPerspectiveAddress)(
      caller
    );
  };
};

const getCommitHistory = function(commitAddress) {
  return caller => {
    const stringCommitInfo = getCommitInfo(commitAddress)(caller);
    const commitInfo = JSON.parse(stringCommitInfo.Ok.App[1]);

    const result = { message: commitInfo.message };
    const parent_commits = commitInfo.parent_commits_addresses.map(
      parentCommitAddress => getCommitHistory(parentCommitAddress)(caller)
    );
    if (parent_commits.length > 0) result['parent_commits'] = parent_commits;
    return result;
  };
};

const getPerspectiveHistory = function(perspectiveAddress) {
  return caller => {
    const { Ok: commitAddress } = getPerspectiveHead(perspectiveAddress)(
      caller
    );
    return getCommitHistory(commitAddress)(caller);
  };
};

const getContextHistory = function(contextAddress) {
  return caller => {
    const {
      Ok: { links: perspectiveAddresses }
    } = getContextPerspectives(contextAddress)(caller);

    return perspectiveAddresses.map(perspectiveAddress => {
      const { Ok: stringPerspectiveInfo } = getPerspectiveInfo(
        perspectiveAddress
      )(caller);

      const perspectiveInfo = JSON.parse(stringPerspectiveInfo.App[1]);
      return {
        name: perspectiveInfo.name,
        commitHistory: getPerspectiveHistory(perspectiveAddress)(caller)
      };
    });
  };
};

const getContextHeadCommits = function(contextAddress) {
  return caller => {
    const {
      Ok: { addresses: perspectiveAddresses }
    } = getContextPerspectives(contextAddress)(caller);

    return perspectiveAddresses.map(address =>
      getPerspectiveHead(address)(caller)
    );
  };
};

const getContextCurrentContents = function(contextAddress) {
  return caller => {
    const headCommitsAddress = getContextHeadCommits(contextAddress)(caller);

    return headCommitsAddress.map(commitAddress =>
      getCommitContent(commitAddress.Ok)(caller)
    );
  };
};

/** Helper builders */

const buildContext = function() {
  return {
    creator: CREATOR_ADDRESS,
    timestamp: Date.now(),
    nonce: 0
  };
};

const buildCommit = function(
  contentAddress,
  message = '',
  parentCommitAddresses = []
) {
  return {
    creator: CREATOR_ADDRESS,
    timestamp: Date.now(),
    message: message,
    content_link: contentAddress,
    parent_commits_links: parentCommitAddresses
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

const parseEntryResult = function(entry) {
  let parseable = entry.Ok ? entry.Ok : entry;
  return parseEntry(parseable.result.Single.entry);
};

const parseEntry = function(entry) {
  const parseable = entry.Ok ? entry.Ok : entry;
  return JSON.parse(parseable.App[1]);
};

module.exports = {
  getRootContext,
  createCommit,
  createNCommits,
  createPerspective,
  createContext,
  createPerspectiveAndContent,
  getContextPerspectives,
  buildContext,
  buildCommit,
  getCommitInfo,
  getPerspectiveInfo,
  mergePerspectives,
  perspectiveAndMerge,
  getPerspectiveHead,
  chain,
  getContextHistory,
  getPerspectiveHistory,
  getCommitHistory,
  getContextHeadCommits,
  getContextCurrentContents,
  parseEntryResult,
  parseEntry,
  CREATOR_ADDRESS
};
