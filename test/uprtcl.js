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
  createPerspectiveAndContent,
  buildContext,
  buildCommit,
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
  getRootContext,
  CREATOR_ADDRESS
} = require('./utils');

const SAMPLE_ADDRESS1 = 'QmXA9hq87xLVqs4EgrzVZ5hRmaaiYUxpUB9J77GeQ5A2en';
const SAMPLE_ADDRESS2 = 'QmePeufDdo28ZcPnXhMJqCEEPPwDqq5yeqnCErQfd37UgE';

/* 
  
  TODO: Uncomment when genesis block is executed
  scenario1.runTape('check root context created', async (t, { alice }) => {
    const contextAddress = await getRootContext()(alice);
    t.equal(contextAddress, 'QmcasGWZuCjaUqKoTZtpnvB9GSAtivXoWksJbhxH7RANYR');
  });

 */

scenario1.runTape('create context', async (t, { alice }) => {
  // Create context
  const { Ok: contextAddress } = await createContext()(alice);

  const result = alice.call('uprtcl', 'get_context_info', {
    context_address: contextAddress
  });

  // Check that context creator is correct
  const contextInfo = parseEntry(result);
  t.equal(contextInfo.creator, CREATOR_ADDRESS);

  // check that context has a perspective associated
  const {
    Ok: { links: perspectiveAddresses }
  } = getContextPerspectives(contextAddress)(alice);
  t.equal(perspectiveAddresses.length, 0);
});

scenario1.runTape(
  'create two commits in master perspective',
  async (t, { alice }) => {
    // Create new context, perspective and commit
    const {
      Ok: { context_address: contextAddress }
    } = await createPerspectiveAndContent(
      buildContext(),
      'master',
      buildCommit(SAMPLE_ADDRESS1, 'Commit message')
    )(alice);

    // Check that the context has one perspective named master
    const {
      Ok: { links: perspectiveAddresses }
    } = getContextPerspectives(contextAddress)(alice);
    t.equal(perspectiveAddresses.length, 1);
    const perspective = getPerspectiveInfo(perspectiveAddresses[0].address)(
      alice
    );
    t.equal(perspective.name, 'master');

    const masterAddress = perspectiveAddresses[0].address;

    // Check that the perspective points to the previously defined commit
    const { Ok: perspectiveHead } = getPerspectiveHead(masterAddress)(alice);
    // ... and check the commit's structure
    const commitInfo = getCommitInfo(perspectiveHead)(alice);
    t.equal(commitInfo.parent_commits_addresses.length, 0);
    t.equal(commitInfo.creator, CREATOR_ADDRESS);
    t.equal(commitInfo.content_address, SAMPLE_ADDRESS1);
    t.equal(commitInfo.message, 'Commit message');

    // Create second commit
    const { Ok: secondCommitAddress } = await createCommit(
      masterAddress,
      'second commit',
      SAMPLE_ADDRESS2
    )(alice);

    // Check that now master points to the new commit
    const { Ok: perspectiveHead2 } = getPerspectiveHead(masterAddress)(alice);
    t.equal(perspectiveHead2, secondCommitAddress);

    // Check that parent commit of the second commit is the first commit
    const secondCommitInfo = getCommitInfo(secondCommitAddress)(alice);
    t.equal(secondCommitInfo.parent_commits_addresses[0], perspectiveHead);
    // Check new commits content and its content is the new content
    t.equal(secondCommitInfo.content_address, SAMPLE_ADDRESS2);
  }
);

scenario1.runTape(
  'create a develop perspective and a commit in it',
  async (t, { alice }) => {
    // Create new context, perspective and commit
    const {
      Ok: {
        context_address: contextAddress,
        perspective_address: masterAddress,
        commit_address: commitAddress
      }
    } = await createPerspectiveAndContent(
      buildContext(),
      'master',
      buildCommit(SAMPLE_ADDRESS1, 'Commit message')
    )(alice);

    // Create another perspective pointing to the initial commit
    const { Ok: developAddress } = await createPerspective(
      contextAddress,
      commitAddress,
      'develop'
    )(alice);
    const developPerspective = getPerspectiveInfo(developAddress)(alice);
    t.equal(developPerspective.name, 'develop');
    t.equal(developPerspective.context_address, contextAddress);

    // Check that the context now has the two correct perspectives
    const {
      Ok: { links: perspectiveAddresses }
    } = getContextPerspectives(contextAddress)(alice);
    t.equal(perspectiveAddresses[0].address, masterAddress);
    t.equal(perspectiveAddresses[1].address, developAddress);

    // Check that the newly created perspective points to the correct commit
    const { Ok: perspectiveHead } = getPerspectiveHead(developAddress)(alice);
    t.equal(perspectiveHead, commitAddress);

    // Create second commit in the develop perspective
    const { Ok: secondCommitAddress } = await createCommit(
      developAddress,
      'second commit',
      SAMPLE_ADDRESS2
    )(alice);

    // Check that master still points to the first commit
    const { Ok: perspectiveHead2 } = getPerspectiveHead(masterAddress)(alice);
    t.equal(perspectiveHead2, commitAddress);

    // Check that develop now points to the newly created commit
    const { Ok: perspectiveHead3 } = getPerspectiveHead(developAddress)(alice);
    t.equal(perspectiveHead3, secondCommitAddress);
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
