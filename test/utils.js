/** Basic functions which call the zome */

const createCommit = function(branchAddress, message, commitContent) {
  return async caller =>
    await caller.callSync('vc', 'create_commit', {
      branch_address: branchAddress,
      message: message,
      content: commitContent
    });
};

const createBranch = function(commitAddress, name) {
  return async caller =>
    await caller.callSync('vc', 'create_branch', {
      commit_address: commitAddress,
      name: name
    });
};

const getBranchHead = function(branchAddress) {
  return caller =>
    caller.call('vc', 'get_branch_head', {
      branch_address: branchAddress
    });
};

const createContext = function(contextName) {
  return async caller =>
    await caller.callSync('vc', 'create_context', {
      name: contextName
    });
};

const getContextBranches = function(contextAddress) {
  return caller =>
    caller.call('vc', 'get_context_branches', {
      context_address: contextAddress
    });
};

const getCommitInfo = function(commitAddress) {
  return caller =>
    caller.call('vc', 'get_commit_info', {
      commit_address: commitAddress
    });
};

const getBranchInfo = function(branchAddress) {
  return caller =>
    caller.call('vc', 'get_branch_info', {
      branch_address: branchAddress
    });
};

const getCommitContent = function(commitAddress) {
  return caller =>
    caller.call('vc', 'get_commit_content', {
      commit_address: commitAddress
    });
};

const mergeBranches = function(fromBranchAddress, toBranchAddress) {
  return async caller =>
    await caller.callSync('vc', 'merge_branches', {
      from_branch_address: fromBranchAddress,
      to_branch_address: toBranchAddress
    });
};

/** Aggregation functions that call the basic zome functions */

const createContextAndCommit = function(contextName, message, commitContent) {
  return async caller => {
    const { Ok: contextAddress } = await createContext(contextName)(caller);
    const {
      Ok: { addresses: branchAddresses }
    } = getContextBranches(contextAddress)(caller);
    const { Ok: commitAddress } = await createCommit(
      branchAddresses[0],
      message,
      commitContent
    )(caller);

    return {
      contextAddress,
      masterAddress: branchAddresses[0],
      commitAddress
    };
  };
};

const createNCommits = function(branchAddress, message, commits) {
  return async caller => {
    var lastCommitAddress;
    for (var [index, commitContent] of commits.entries()) {
      lastCommitAddress = await createCommit(
        branchAddress,
        message + index,
        commitContent
      )(caller);
    }
    return lastCommitAddress;
  };
};

const branchAndMerge = function(originBranchAddress, commitContent) {
  return async caller => {
    const { Ok: commitAddress } = getBranchHead(originBranchAddress)(caller);
    const { Ok: developAddress } = await createBranch(commitAddress, 'develop')(
      caller
    );

    await createCommit(developAddress, 'develop commit', commitContent)(caller);

    return await mergeBranches(developAddress, originBranchAddress)(caller);
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

const getBranchHistory = function(branchAddress) {
  return caller => {
    const { Ok: commitAddress } = getBranchHead(branchAddress)(caller);
    return getCommitHistory(commitAddress)(caller);
  };
};

const getContextHistory = function(contextAddress) {
  return caller => {
    const {
      Ok: { addresses: branchAddresses }
    } = getContextBranches(contextAddress)(caller);

    return branchAddresses.map(branchAddress => {
      const { Ok: stringBranchInfo } = getBranchInfo(branchAddress)(caller);

      const branchInfo = JSON.parse(stringBranchInfo.App[1]);
      return {
        name: branchInfo.name,
        commitHistory: getBranchHistory(branchAddress)(caller)
      };
    });
  };
};

/** Helper builders */

const buildObject = function(dataAddress, subcontents = {}) {
  return {
    data: dataAddress,
    subcontent: subcontents
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

module.exports = {
  createCommit,
  createNCommits,
  createBranch,
  createContext,
  createContextAndCommit,
  getContextBranches,
  buildObject,
  getCommitContent,
  getCommitInfo,
  getBranchInfo,
  mergeBranches,
  branchAndMerge,
  getBranchHead,
  chain,
  getContextHistory,
  getBranchHistory,
  getCommitHistory
};
