const createCommit = async function(
  caller,
  branchAddress,
  message,
  dnaAddress,
  entryAddress
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

const createNCommits = async function(caller, number, branchAddress, message, dnaAddress, entryAddress) {
  var lastCommitAddress;
  for (var i = 0; i < number; i++) {
    lastCommitAddress = await createCommit(caller, branchAddress, message, dnaAddress, entryAddress);
  }
  return lastCommitAddress;
}

const createBranch = async function(caller, commitAddress, name) {
  return await caller.callSync('vc', 'create_branch_in_context', {
    commit_address: commitAddress,
    name: name
  });
};

module.exports = { createCommit, createNCommits, createBranch };
