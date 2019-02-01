/** Basic functions which call the zome */

const createCommit = async function(
  caller,
  branchAddress,
  { message, commitContent }
) {
  return await caller.callSync('vc', 'create_commit', {
    branch_address: branchAddress,
    message: message,
    content: commitContent
  });
};

const createBranch = async function(caller, commitAddress, name) {
  return await caller.callSync('vc', 'create_branch_in_context', {
    commit_address: commitAddress,
    name: name
  });
};

const createContext = async function(caller, contextName) {
  return await caller.callSync('vc', 'create_context', {
    name: 'myNewContext'
  });
};

const getContextBranches = function(caller, contextAddress) {
  return caller.call('vc', 'get_context_branches', {
    context_address: contextAddress
  });
};

const getCommitInfo = function(caller, commitAddress) {
  return caller.call('vc', 'get_commit_info', {
    commit_address: commitAddress
  });
};

const getCommitContent = function(caller, commitAddress) {
  return caller.call('vc', 'get_commit_content', {
    commit_address: commitAddress
  });
};

//const mergeBranches = async function(caller, fromBranchAddress, toBranchAddress) {}

/** Aggregation functions that call the basic zome functions */

const createContextAndCommit = async function(
  caller,
  contextName,
  { message, commitContent }
) {
  const { Ok: contextAddress } = await createContext(caller, contextName);
  const {
    Ok: { addresses: branchAddresses }
  } = getContextBranches(caller, contextAddress);
  const { Ok: commitAddress } = await createCommit(caller, branchAddresses[0], {
    message,
    commitContent
  });

  return {
    contextAddress,
    masterAddress: branchAddresses[0],
    commitAddress
  };
};

const createNCommits = async function(caller, branchAddress, commits) {
  var lastCommitAddress;
  for (var { message, commitContent } of commits) {
    lastCommitAddress = await createCommit(caller, branchAddress, {
      message,
      commitContent
    });
  }
  return lastCommitAddress;
};

/** Helper builders */

const buildBlobCommit = function(message, dnaAddress, entryAddress) {
  return {
    message: message,
    commitContent: {
      ContentBlob: {
        content: {
          HolochainEntry: {
            dna_address: dnaAddress,
            entry_address: entryAddress
          }
        }
      }
    }
  };
};
const buildTreeCommit = function(message, treeContents) {
  return {
    message: message,
    commitContent: {
      ContentTree: {
        contents: treeContents
      }
    }
  };
};

module.exports = {
  createCommit,
  createNCommits,
  createBranch,
  createContext,
  createContextAndCommit,
  getContextBranches,
  buildBlobCommit,
  buildTreeCommit,
  getCommitContent,
  getCommitInfo
};
