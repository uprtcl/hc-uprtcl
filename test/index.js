const path = require('path');

const { Config, Scenario } = require('../../holochain-rust/nodejs_conductor');
Scenario.setTape(require('tape'));

const dnaPath = path.join(__dirname, '../dist/hc-versioncontrol.dna.json');
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
  getBranchInfo,
  getContextHeadCommits,
  getContextCurrentContents,
  parseEntry
} = require('./utils');

const SAMPLE_ADDRESS1 = 'QmdYFTXuTyuaXbyLAPHmemgkjsaVQ5tfpnLqY9on5JZmzR';
const SAMPLE_ADDRESS2 = 'QmXA9hq87xLVqs4EgrzVZ5hRmaaiYUxpUB9J77GeQ5A2en';
const SAMPLE_ADDRESS3 = 'QmRqn5F3J3uL8NRoCugfNJF8556cp1khZJAP1XAdVdL73S';

scenario1.runTape('create context', async (t, { alice }) => {
  const { Ok: contextAddress } = await createContext('myNewContext')(alice);
  t.equal(contextAddress, 'QmcasGWZuCjaUqKoTZtpnvB9GSAtivXoWksJbhxH7RANYR');

  const result = alice.call('vc', 'get_context_info', {
    context_address: contextAddress
  });

  const contextInfo = parseEntry(result);

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
      'Qmdc41NJ5SEF89wUqsurm3foz9sEza5hcJbEnDMo8uBQub'
    );

    const { Ok: firstCommitAddress } = await createCommit(
      branchAddresses[0],
      'first commit',
      buildObject(SAMPLE_ADDRESS1)
    )(alice);
    t.equal(
      firstCommitAddress,
      'QmWv8Qz3bmqPz1cTWArAdmLcZHif3dJ5Jpj211Fos8mmAQ'
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
      'QmefjwHuhjajsRSeMuhe2uVzvvvB5ReZ3G23zwBAXqYEe3'
    );

    const commitInfoJsonString = getCommitInfo(secondCommitAddress)(alice);
    const commitInfo = parseEntry(commitInfoJsonString);
    t.equal(commitInfo.context_address, contextAddress);

    t.equal(commitInfo.parent_commits_addresses[0], firstCommitAddress);

    const commitJsonString = getCommitContent(secondCommitAddress)(alice);
    const commitContent = parseEntry(commitJsonString);

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
    t.equal(developAddress, 'QmPV17A2Y1rJ7yzif6AApaYP7ianS6FwBpFNEfqqyqJVA2');

    const developBranchJson = getBranchInfo(developAddress)(alice);
    const developBranchInfo = parseEntry(developBranchJson);
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
      buildObject(null, [
        { name: 'file1', address: SAMPLE_ADDRESS2 },
        { name: 'file2', address: SAMPLE_ADDRESS1 }
      ])
    )(alice);
    t.equal(commitAddress, 'QmaECgwN2H2xLXpMYBjDBg6BAyHxpQx1bP2Y862HFyfyuN');

    const { Ok: developAddress } = await createBranch(commitAddress, 'develop')(
      alice
    );
    const { Ok: developCommit } = await createCommit(
      developAddress,
      'develop commit',
      buildObject(null, [
        {
          name: 'file1',
          address: SAMPLE_ADDRESS2
        },
        { name: 'file2', address: SAMPLE_ADDRESS2 },
        { name: 'file3', address: SAMPLE_ADDRESS2 }
      ])
    )(alice);

    const { Ok: mergedCommitAddress } = await mergeBranches(
      developAddress,
      masterAddress
    )(alice);

    t.equal(
      mergedCommitAddress,
      'QmYxeYk1hRvUo2dESjciBThc28DKSiKJ8U9JyiJAbmkmA1'
    );

    const { Ok: commitInfoJsonString } = getCommitInfo(mergedCommitAddress)(
      alice
    );
    const commitInfo = parseEntry(commitInfoJsonString);

    t.deepEqual(commitInfo.parent_commits_addresses, [
      developCommit,
      commitAddress
    ]);

    const commitContentString = getCommitContent(mergedCommitAddress)(alice);
    const commitContent = parseEntry(commitContentString);

    t.deepEqual(commitContent, {
      data: null,
      links: [
        { name: 'file1', address: SAMPLE_ADDRESS2 },
        { name: 'file2', address: SAMPLE_ADDRESS2 },
        {
          name: 'file3',
          address: SAMPLE_ADDRESS2
        }
      ]
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
      buildObject(null, [
        {
          name: 'file1',
          address: SAMPLE_ADDRESS2
        },
        { name: 'file2', address: SAMPLE_ADDRESS1 }
      ])
    )(alice);
    const { Ok: developAddress } = await createBranch(commitAddress, 'develop')(
      alice
    );
    const { Ok: masterCommit } = await createCommit(
      masterAddress,
      'master commit 2',
      buildObject(null, [
        {
          name: 'file1',
          address: SAMPLE_ADDRESS1
        },
        { name: 'file2', address: SAMPLE_ADDRESS1 },
        { name: 'file3', address: SAMPLE_ADDRESS2 }
      ])
    )(alice);
    const { Ok: developCommit } = await createCommit(
      developAddress,
      'develop commit',
      buildObject(null, [
        {
          name: 'file1',
          address: SAMPLE_ADDRESS3
        },
        { name: 'file2', address: SAMPLE_ADDRESS2 },
        { name: 'file4', address: SAMPLE_ADDRESS2 }
      ])
    )(alice);

    const result = await mergeBranches(developAddress, masterAddress)(alice);

    t.deepEqual(result, {
      Err: { Internal: 'there was a conflict trying to merge' }
    });
  }
);

scenario1.runTape('save document', async (t, { alice }) => {
  const { Ok: documentAddress } = await alice.callSync(
    'documents',
    'save_document',
    {
      title: 'Title',
      content: 'content'
    }
  );
  t.equal(documentAddress, 'QmT2eRGdpZmxJxHSbkFhczaSgLukL8YqMqwoX85jb9X43Q');
});
