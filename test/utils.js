/** Basic functions which call the zome */

const createCommit = async function(
  caller,
  branchAddress,
  { message, dnaAddress, entryAddress }
) {
  return await caller.callSync('vc', 'create_commit', {
    branch_address: branchAddress,
    message: message,
    content: {
      ContentBlob: {
        content: {
          HolochainEntry: {
            dna_address: dnaAddress,
            entry_address: entryAddress
          }
        }
      }
    }
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

/** Aggregation functions that call the basic zome functions */

const createContextAndCommit = async function(
  caller,
  contextName,
  { message, dnaAddress, entryAddress }
) {
  const { Ok: contextAddress } = await createContext(caller, contextName);
  const {
    Ok: { addresses: branchAddresses }
  } = getContextBranches(caller, contextAddress);
  const { Ok: commitAddress } = await createCommit(caller, branchAddresses[0], {
    message,
    dnaAddress,
    entryAddress
  });

  return {
    contextAddress,
    masterAddress: branchAddresses[0],
    commitAddress
  };
};

const createNCommits = async function(
  caller,
  number,
  branchAddress,
  { message, dnaAddress, entryAddress }
) {
  var lastCommitAddress;
  for (var i = 0; i < number; i++) {
    lastCommitAddress = await createCommit(caller, branchAddress, {
      message,
      dnaAddress,
      entryAddress
    });
  }
  return lastCommitAddress;
};

module.exports = {
  createCommit,
  createNCommits,
  createBranch,
  createContext,
  createContextAndCommit,
  getContextBranches
};
