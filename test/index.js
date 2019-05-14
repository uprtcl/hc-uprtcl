const path = require('path');

const {
  Config,
  Scenario
} = require('../../../holochain/holochain-rust/nodejs_conductor');
Scenario.setTape(require('tape'));

const dnaPath = path.join(__dirname, '../dist/hc-uprtcl.dna.json');
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
  createPerspective,
  createContext,
  getContextPerspectives,
  createContextAndCommit,
  buildObject,
  getCommitContent,
  getCommitInfo,
  mergePerspectives,
  perspectiveAndMerge,
  getPerspectiveHead,
  chain,
  getContextHistory,
  getPerspectiveHistory,
  getCommitHistory,
  getPerspectiveInfo,
  getContextHeadCommits,
  getContextCurrentContents,
  parseEntry,
  getRootContext
} = require('./utils');

const SAMPLE_ADDRESS1 = 'QmdYFTXuTyuaXbyLAPHmemgkjsaVQ5tfpnLqY9on5JZmzR';
const SAMPLE_ADDRESS2 = 'QmXA9hq87xLVqs4EgrzVZ5hRmaaiYUxpUB9J77GeQ5A2en';
const SAMPLE_ADDRESS3 = 'QmRqn5F3J3uL8NRoCugfNJF8556cp1khZJAP1XAdVdL73S';

/* 
  
  TODO: Uncomment when genesis block is executed
  scenario1.runTape('check root context created', async (t, { alice }) => {
    const contextAddress = await getRootContext()(alice);
    t.equal(contextAddress, 'QmcasGWZuCjaUqKoTZtpnvB9GSAtivXoWksJbhxH7RANYR');
  });

 */

scenario1.runTape('create context', async (t, { alice }) => {
  /*   const contextAddress = alice.call('uprtcl', 'create_context', {
    name: 'fddf'
  });
 */

  const { Ok: contextAddress } = await createContext('myNewContext')(alice);
  t.equal(contextAddress, 'QmXcXwirRCE7oeVnJcuiqfKz55PJD9npVsxHpNVhX571Ve');

  const result = alice.call('uprtcl', 'get_context_info', {
    context_address: contextAddress
  });

  const contextInfo = parseEntry(result);
  t.equal(
    contextInfo.creator,
    'HcScjwO9ji9633ZYxa6IYubHJHW6ctfoufv5eq4F7ZOxay8wR76FP4xeG9pY3ui'
  );

  // check that context has a perspective associated
  const {
    Ok: { links: perspectiveAddresses }
  } = getContextPerspectives(contextAddress)(alice);
  t.equal(perspectiveAddresses.length, 1);

  const developPerspectiveJson = getPerspectiveInfo(
    perspectiveAddresses[0].address
  )(alice);

  t.equal(parseEntry(developPerspectiveJson).name, 'myNewContext');
});

scenario1.runTape(
  'create two commits in master perspective',
  async (t, { alice }) => {
    const { Ok: contextAddress } = await createContext('myNewContext')(alice);

    const {
      Ok: { links: perspectiveAddresses }
    } = getContextPerspectives(contextAddress)(alice);
    t.equal(
      perspectiveAddresses[0].address,
      'QmRaQdRDzhwSFgnPnNnM7f6N4RSEZjuuXGbaSsbbjr8TJg'
    );

    const { Ok: firstCommitAddress } = await createCommit(
      perspectiveAddresses[0].address,
      'first commit',
      buildObject(SAMPLE_ADDRESS1)
    )(alice);
    t.equal(
      firstCommitAddress,
      'QmVVMnuHc7Tunh2FGRSbwnVN6QPJ5rbgznfd78jab1By6Q'
    );

    const { Ok: perspectiveHead } = getPerspectiveHead(
      perspectiveAddresses[0].address
    )(alice);
    t.equal(perspectiveHead, firstCommitAddress);

    const { Ok: secondCommitAddress } = await createCommit(
      perspectiveAddresses[0].address,
      'second commit',
      buildObject(SAMPLE_ADDRESS1)
    )(alice);
    t.equal(
      secondCommitAddress,
      'QmePeufDdo28ZcPnXhMJqCEEPPwDqq5yeqnCErQfd37UgE'
    );

    const commitInfoJsonString = getCommitInfo(secondCommitAddress)(alice);
    const commitInfo = parseEntry(commitInfoJsonString);

    t.equal(commitInfo.parent_commits_addresses[0], firstCommitAddress);

    const commitJsonString = getCommitContent(secondCommitAddress)(alice);
    const commitContent = parseEntry(commitJsonString);

    t.equal(commitContent.data, SAMPLE_ADDRESS1);
  }
);

scenario1.runTape(
  'create a develop perspective and a commit in it',
  async (t, { alice }) => {
    const { commitAddress, contextAddress } = await createContextAndCommit(
      'myNewContext',
      'first commit',
      buildObject(null)
    )(alice);

    const { Ok: developAddress } = await createPerspective(
      contextAddress,
      commitAddress,
      'develop'
    )(alice);
    t.equal(developAddress, 'QmeWpk7JXixomJMNYu78H7Vp8Jk6AtwT7agedWG3GuaU3y');

    const developPerspectiveJson = getPerspectiveInfo(developAddress)(alice);
    const developPerspectiveInfo = parseEntry(developPerspectiveJson);
    t.equal(developPerspectiveInfo.context_address, contextAddress);

    const {
      Ok: { links: perspectiveAddresses }
    } = getContextPerspectives(contextAddress)(alice);
    t.equal(perspectiveAddresses[1].address, developAddress);
  }
);
/* 
scenario1.runTape(
  'merge two perspectives with no conflict',
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

    const { Ok: developAddress } = await createPerspective(
      commitAddress,
      'develop'
    )(alice);
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

    const { Ok: mergedCommitAddress } = await mergePerspectives(
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

    const { Ok: lastMasterCommitAddress } = await getPerspectiveHead(
      masterAddress
    )(alice);
    t.equal(lastMasterCommitAddress, mergedCommitAddress);
  }
);

scenario1.runTape(
  'merge two perspectives with changed content creates conflict',
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
    const { Ok: developAddress } = await createPerspective(
      commitAddress,
      'develop'
    )(alice);
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

    const result = await mergePerspectives(developAddress, masterAddress)(
      alice
    );

    t.deepEqual(result, {
      Err: { Internal: 'there was a conflict trying to merge' }
    });
  }
);
 */