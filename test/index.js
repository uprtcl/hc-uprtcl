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
  buildObject,
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

const SAMPLE_ADDRESS1 = 'QmdYFTXuTyuaXbyLAPHmemgkjsaVQ5tfpnLqY9on5JZmzR';
const SAMPLE_ADDRESS2 = 'QmXA9hq87xLVqs4EgrzVZ5hRmaaiYUxpUB9J77GeQ5A2en';
const SAMPLE_ADDRESS3 = 'QmRqn5F3J3uL8NRoCugfNJF8556cp1khZJAP1XAdVdL73S';

const blobCommit = () => buildBlobCommit(SAMPLE_ADDRESS1, SAMPLE_ADDRESS2);

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
      buildObject(SAMPLE_ADDRESS1)
    )(alice);
    t.equal(
      firstCommitAddress,
      'QmdHCYqdC6zHhRUD7GmgxyvHAz8BLzoY5gfZSAfbaW86wp'
    );

    const { Ok: branchHead } = getBranchHead(branchAddresses[0])(alice);
    t.equal(branchHead, firstCommitAddress);

    const { Ok: secondCommitAddress } = await createCommit(
      branchAddresses[0],
      'second commit',
      buildObject(SAMPLE_ADDRESS1)
    )(alice);
    t.equal(
      secondCommitAddress,
      'QmVi27G7WYokDcUAod1pZevRAdZasGVywWWqfx7fNmJKmN'
    );

    const commitInfoJsonString = getCommitInfo(secondCommitAddress)(alice);
    const commitInfo = JSON.parse(commitInfoJsonString.Ok.App[1]);

    t.equal(commitInfo.context_address, contextAddress);
    t.equal(commitInfo.parent_commits_addresses[0], firstCommitAddress);

    const commitJsonString = getCommitContent(secondCommitAddress)(alice);
    const commitContent = JSON.parse(commitJsonString.Ok.App[1]);

    t.equal(commitContent.data, SAMPLE_ADDRESS1);
  }
);

scenario1.runTape(
  'create a develop branch and a commit in it',
  async (t, { alice }) => {
    const { commitAddress, contextAddress } = await createContextAndCommit(
      'myNewContext',
      'first commit',
      buildObject(null)
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
  'merge two branches with no conflict',
  async (t, { alice }) => {
    const { commitAddress, masterAddress } = await createContextAndCommit(
      'myNewContext',
      'first commit',
      buildObject(null, {
        file1: SAMPLE_ADDRESS2,
        file2: SAMPLE_ADDRESS1
      })
    )(alice);
    t.equal(commitAddress, 'QmdWfhvyAn1tqXwCEoFRgN2bDr4g7WkdhypLp1QuG9jyW1');

    const { Ok: developAddress } = await createBranch(commitAddress, 'develop')(
      alice
    );
    const { Ok: developCommit } = await createCommit(
      developAddress,
      'develop commit',
      buildObject(null, {
        file1: SAMPLE_ADDRESS2,
        file2: SAMPLE_ADDRESS2,
        file3: SAMPLE_ADDRESS2
      })
    )(alice);

    const { Ok: mergedCommitAddress } = await mergeBranches(
      developAddress,
      masterAddress
    )(alice);

    t.equal(
      mergedCommitAddress,
      'QmSMNTPW8Q9BbFxCJxwvSQdDcnN4dxmuZr8634bh8ygpz4'
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
    const commitContent = JSON.parse(commitContentString.App[1]);

    t.deepEqual(commitContent, {
      data: null,
      subcontent: {
        file3: SAMPLE_ADDRESS2,
        file2: SAMPLE_ADDRESS2,
        file1: SAMPLE_ADDRESS2
      }
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
      buildObject(null, {
        file1: SAMPLE_ADDRESS2,
        file2: SAMPLE_ADDRESS1
      })
    )(alice);
    const { Ok: developAddress } = await createBranch(commitAddress, 'develop')(
      alice
    );
    const { Ok: masterCommit } = await createCommit(
      masterAddress,
      'master commit 2',
      buildObject(null, {
        file1: SAMPLE_ADDRESS1,
        file2: SAMPLE_ADDRESS1,
        file3: SAMPLE_ADDRESS2
      })
    )(alice);
    const { Ok: developCommit } = await createCommit(
      developAddress,
      'develop commit',
      buildObject(null, {
        file1: SAMPLE_ADDRESS3,
        file2: SAMPLE_ADDRESS2,
        file4: SAMPLE_ADDRESS2
      })
    )(alice);

    const result = await mergeBranches(developAddress, masterAddress)(alice);

    t.deepEqual(result, {
      Err: { Internal: 'there was a conflict trying to merge' }
    });
  }
);
