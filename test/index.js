const path = require('path');

const {
  Config,
  Container,
  Scenario
} = require('../../holochain-rust/nodejs_container');
Scenario.setTape(require('tape'));

const dnaPath = path.join(__dirname, '../dist/bundle.json');
const dna = Config.dna(dnaPath);
const agentAlice = Config.agent('alice');
const agentBob = Config.agent('bob');

const instanceAlice = Config.instance(agentAlice, dna);
const instanceBob = Config.instance(agentBob, dna);

const scenario1 = new Scenario([instanceAlice]);

// Utils variables to facilitate testing code

const {
  createCommit,
  createNCommits,
  createBranch,
  createContext,
  getContextBranches,
  createContextAndCommit,
  buildBlobCommit,
  buildTreeCommit,
  getCommitContent,
  getCommitInfo,
  mergeBranches,
  branchAndMerge,
  getBranchHead,
  chain,
  getContextHistory,
  getBranchHistory,
  getCommitHistory,
  getBranchInfo
} = require('./utils');

const DNA_ADDRESS = 'QmdYFTXuTyuaXbyLAPHmemgkjsaVQ5tfpnLqY9on5JZmzR';
const ENTRY_ADDRESS = 'QmXA9hq87xLVqs4EgrzVZ5hRmaaiYUxpUB9J77GeQ5A2en';
const SAMPLE_ADDRESS1 = 'QmRqn5F3J3uL8NRoCugfNJF8556cp1khZJAP1XAdVdL73S';

const blobCommit = () => buildBlobCommit(DNA_ADDRESS, ENTRY_ADDRESS);

scenario1.runTape('create context', async (t, { alice }) => {
  // Make a call to a Zome function
  // indicating the capability and function, and passing it an input
  const { Ok: contextAddress } = await createContext('myNewContext')(alice);
  t.equal(contextAddress, 'QmXA9hq87xLVqs4EgrzVZ5hRmaaiYUxpUB9J77GeQ5A2en');

  const result = alice.call('vc', 'get_context_info', {
    context_address: contextAddress
  });

  const contextInfo = JSON.parse(result.Ok.App[1]);

  // check for equality of the actual and expected results
  t.equal(contextInfo.name, 'myNewContext');
});

scenario1.runTape(
  'create two commits in master branch',
  async (t, { alice }) => {
    const { Ok: contextAddress } = await createContext('myNewContext')(alice);

    const {
      Ok: { addresses: branchAddresses }
    } = getContextBranches(contextAddress)(alice);
    t.equal(
      branchAddresses[0],
      'QmdYFTXuTyuaXbyLAPHmemgkjsaVQ5tfpnLqY9on5JZmzR'
    );

    const { Ok: firstCommitAddress } = await createCommit(
      branchAddresses[0],
      'first commit',
      blobCommit()
    )(alice);
    t.equal(
      firstCommitAddress,
      'QmdAEiLANFiMfZQ9ZTGLRkjSDr5kkD7zPFt5fF5qaExQBC'
    );

    const { Ok: branchHead } = getBranchHead(branchAddresses[0])(alice);
    t.equal(branchHead, firstCommitAddress);

    const { Ok: secondCommitAddress } = await createCommit(
      branchAddresses[0],
      'second commit',
      blobCommit()
    )(alice);
    t.equal(
      secondCommitAddress,
      'QmPKNmfDA3rWUL3HHxqAeAhQDmQ7J2HyJjiBWFnVvBz2DU'
    );

    const commitInfoJsonString = getCommitInfo(secondCommitAddress)(alice);
    const commitInfo = JSON.parse(commitInfoJsonString.Ok.App[1]);

    t.equal(commitInfo.context_address, contextAddress);
    t.equal(commitInfo.parent_commits_addresses[0], firstCommitAddress);

    const commitJsonString = getCommitContent(secondCommitAddress)(alice);
    const commitContent = JSON.parse(commitJsonString.Ok.App[1]);

    t.equal(commitContent.content.HolochainEntry.dna_address, DNA_ADDRESS);
    t.equal(commitContent.content.HolochainEntry.entry_address, ENTRY_ADDRESS);
  }
);

scenario1.runTape(
  'create a develop branch and a commit in it',
  async (t, { alice }) => {
    const { commitAddress, contextAddress } = await createContextAndCommit(
      'myNewContext',
      'first commit',
      blobCommit()
    )(alice);

    const { Ok: developAddress } = await createBranch(commitAddress, 'develop')(
      alice
    );
    t.equal(developAddress, 'QmRqn5F3J3uL8NRoCugfNJF8556cp1khZJAP1XAdVdL73S');

    const developBranchJson = getBranchInfo(developAddress)(alice);
    const developBranchInfo = JSON.parse(developBranchJson.Ok.App[1]);
    t.equal(developBranchInfo.context_address, contextAddress);

    const {
      Ok: { addresses: branchAddresses }
    } = getContextBranches(contextAddress)(alice);
    t.deepEqual(branchAddresses, [branchAddresses[0], developAddress]);
  }
);

scenario1.runTape(
  'merge two branches with no merge',
  async (t, { alice }) => {
    const { commitAddress, masterAddress } = await createContextAndCommit(
      'myNewContext',
      'first commit',
      buildTreeCommit({
        file1: ENTRY_ADDRESS,
        file2: DNA_ADDRESS
      })
    )(alice);

    const { Ok: developAddress } = await createBranch(commitAddress, 'develop')(
      alice
    );
    const { Ok: developCommit } = await createCommit(
      developAddress,
      'develop commit',
      buildTreeCommit({
        file1: ENTRY_ADDRESS,
        file2: ENTRY_ADDRESS,
        file3: ENTRY_ADDRESS
      })
    )(alice);

    const { Ok: mergedCommitAddress } = await mergeBranches(
      developAddress,
      masterAddress
    )(alice);

    t.equal(
      mergedCommitAddress,
      'QmdazHAnnKXzKikbW9PVAUTg2rp5h9vCyUQzCsbiEBZRu9'
    );

    const { Ok: commitInfoJsonString } = getCommitInfo(mergedCommitAddress)(
      alice
    );
    const commitInfo = JSON.parse(commitInfoJsonString.App[1]);

    t.deepEqual(commitInfo.parent_commits_addresses, [
      developCommit,
      commitAddress
    ]);

    const { Ok: commitContentString } = getCommitContent(mergedCommitAddress)(
      alice
    );
    const { contents: commitContent } = JSON.parse(commitContentString.App[1]);

    t.deepEqual(commitContent, {
      file3: ENTRY_ADDRESS,
      file2: ENTRY_ADDRESS,
      file1: ENTRY_ADDRESS
    });

    const { Ok: lastMasterCommitAddress } = await getBranchHead(masterAddress)(
      alice
    );
    t.equal(lastMasterCommitAddress, mergedCommitAddress);
  }
);

scenario1.runTape(
  'merge two branches with changed content creates conflict',
  async (t, { alice }) => {
    const { commitAddress, masterAddress } = await createContextAndCommit(
      'myNewContext',
      'first commit',
      buildTreeCommit({
        file1: ENTRY_ADDRESS,
        file2: DNA_ADDRESS
      })
    )(alice);
    const { Ok: developAddress } = await createBranch(commitAddress, 'develop')(
      alice
    );
    const { Ok: masterCommit } = await createCommit(
      masterAddress,
      'master commit 2',
      buildTreeCommit({
        file1: ENTRY_ADDRESS,
        file2: SAMPLE_ADDRESS1,
        file3: ENTRY_ADDRESS
      })
    )(alice);
    const { Ok: developCommit } = await createCommit(
      developAddress,
      'develop commit',
      buildTreeCommit({
        file1: ENTRY_ADDRESS,
        file2: ENTRY_ADDRESS,
        file4: ENTRY_ADDRESS
      })
    )(alice);

    const result = await mergeBranches(developAddress, masterAddress)(alice);

    t.deepEqual(result, {
      Err: { Internal: 'there was a conflict trying to merge' }
    });
  }
);
