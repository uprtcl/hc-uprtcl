const path = require('path');

const {
  Config,
  Scenario
} = require('../../../holochain/holochain-rust/nodejs_conductor');
Scenario.setTape(require('tape'));

const dnaPath = path.join(__dirname, '../dist/hc-uprtcl.dna.json');
const dna = Config.dna(dnaPath);
const agentAlice = Config.agent('alice');

const instanceAlice = Config.instance(agentAlice, dna);

const scenario1 = new Scenario([instanceAlice]);

// Utils variables to facilitate testing code

const {
  getContextInfo,
  createContext,
  cloneContext,
  createPerspective,
  clonePerspective,
  getRootContextId,
  getPerspectiveInfo,
  getContextPerspectives,
  getPerspectiveHead,
  updatePerspectiveHead,
  createCommit,
  cloneCommit,
  getCommitInfo,
  createCommitInPerspective,
  createContextPerspectiveAndCommit,
  buildContext,
  buildPerspective,
  buildCommit,
  buildProvenance,
  parseEntryResult,
  CREATOR_ADDRESS
} = require('./utils');

const SAMPLE_ADDRESS1 = 'QmXA9hq87xLVqs4EgrzVZ5hRmaaiYUxpUB9J77GeQ5A2en';
const SAMPLE_ADDRESS2 = 'QmePeufDdo28ZcPnXhMJqCEEPPwDqq5yeqnCErQfd37UgE';

/* 
TODO: Uncomment when root context is created at genesis time

scenario1.runTape('check root context created', async (t, { alice }) => {
  let contextAddress = await getRootContextId()(alice);
  t.equal(contextAddress, 'QmdyhNVV7AqBMriBKmCUUJq5hWDfz5ny3Syp2HNeSiWwvr');

  const perspectives = await getContextPerspectives(contextAddress)(alice);
  t.equal(perspectives.length, 0);

  t.equal(perspectives, 'QmdyhNVV7AqBMriBKmCUUJq5hWDfz5ny3Syp2HNeSiWwvr');
  
  //t.equal(perspective.origin.includes('holochain://'), true);
});
*/

scenario1.runTape('create context', async (t, { alice }) => {
  // Create context
  const contextAddress = await createContext()(alice);

  const result = await getContextInfo(contextAddress)(alice);

  // Check that context creator is correct
  t.equal(result.creator, CREATOR_ADDRESS);

  // check that context has a perspective associated
  const perspectives = await getContextPerspectives(contextAddress)(alice);
  t.equal(perspectives.length, 0);
});

scenario1.runTape(
  'create perspective with proxy addresses',
  async (t, { alice }) => {
    // Create perspective pointing proxy addresses
    const perspectiveAddress = await createPerspective(
      'proxy1',
      'develop',
      'proxy2'
    )(alice); 
    // check that context has a perspective associated
    t.equal(perspectiveAddress.startsWith('Qm'), true);
  }
);

scenario1.runTape(
  'create two commits in master perspective',
  async (t, { alice }) => {
    // Create new context, perspective and commit
    const {
      contextAddress,
      perspectiveAddress,
      commitAddress
    } = await createContextPerspectiveAndCommit(
      'Commit message',
      SAMPLE_ADDRESS1,
      'master'
    )(alice);

    // Check that the context has one perspective named master
    const perspectives = await getContextPerspectives(contextAddress)(alice);
    t.equal(perspectives.length, 1);
    t.equal(perspectives[0].name, 'master');

    const masterAddress = perspectives[0].id;

    // Check that the perspective points to the previously defined commit
    const perspectiveHead = await getPerspectiveHead(masterAddress)(alice);
    // ... and check the commit's structure
    const commitInfo = getCommitInfo(perspectiveHead)(alice);
    t.equal(commitInfo.parent_commits_addresses.length, 0);
    t.equal(commitInfo.creator, CREATOR_ADDRESS);
    t.equal(commitInfo.content_address, SAMPLE_ADDRESS1);
    t.equal(commitInfo.message, 'Commit message');

    // Create second commit
    const secondCommitAddress = await createCommit(
      'second commit',
      [commitAddress],
      SAMPLE_ADDRESS2
    )(alice);

    // Update perspective head
    await updatePerspectiveHead(masterAddress, secondCommitAddress)(alice);

    // Check that now master points to the new commit
    // Double call to avoid network synchronization issues
    let perspectiveHead2 = await getPerspectiveHead(masterAddress)(alice);
    perspectiveHead2 = await getPerspectiveHead(masterAddress)(alice);
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
      contextAddress,
      perspectiveAddress,
      commitAddress
    } = await createContextPerspectiveAndCommit(
      'Commit message',
      SAMPLE_ADDRESS1,
      'master'
    )(alice);

    // Create another perspective pointing to the initial commit
    const developAddress = await createPerspective(
      contextAddress,
      'develop',
      commitAddress
    )(alice);
    const developPerspective = getPerspectiveInfo(developAddress)(alice);
    t.equal(developPerspective.name, 'develop');
    t.equal(developPerspective.context_address, contextAddress);

    // Check that the context now has the two correct perspectives
    const perspectives = await getContextPerspectives(contextAddress)(alice);
    t.equal(perspectives[0].id, perspectiveAddress);
    t.equal(perspectives[1].id, developAddress);

    // Check that the newly created perspective points to the correct commit
    const perspectiveHead = await getPerspectiveHead(developAddress)(alice);
    t.equal(perspectiveHead, commitAddress);

    // Create second commit in the develop perspective
    const secondCommitAddress = await createCommitInPerspective(
      developAddress,
      'second commit',
      SAMPLE_ADDRESS2
    )(alice);

    // Check that master still points to the first commit
    const perspectiveHead2 = await getPerspectiveHead(perspectiveAddress)(
      alice
    );
    t.equal(perspectiveHead2, commitAddress);

    // Check that develop now points to the newly created commit
    const perspectiveHead3 = await getPerspectiveHead(developAddress)(alice);
    t.equal(perspectiveHead3, secondCommitAddress);
  }
);

scenario1.runTape('clone with invalid keys fails', async (t, { alice }) => {
  // Clone context
  let errorMessage = await cloneContext(
    buildContext(CREATOR_ADDRESS, 0, 0),
    buildProvenance(
      CREATOR_ADDRESS,
      '1UKVugll/HSeZ9pM9Je9z3Y3xFmSSsZ3mprd4ObZnGZ91GEj6LqtjgCZavK19hUcqnJdxU+PBgjBPSYU3v0ZeCA=='
    )
  )(alice);
  t.equal(errorMessage.Err.Internal.includes('ValidationFailed'), true);

  // Clone commit
  errorMessage = await cloneCommit(
    buildCommit(SAMPLE_ADDRESS1, 0, 'commit messages', []),
    buildProvenance(
      CREATOR_ADDRESS,
      '3PdfvyQ0mn/kVC8B/yD0d1weT8rXs4AmJE7oagmN/xPK4omsXFp4gKLkPo+65cjtOpE3G3FuTnS0jpaYtwCuIBg=='
    )
  )(alice);
  t.equal(errorMessage.Err.Internal.includes('ValidationFailed'), true);

  // Clone perspective
  errorMessage = await clonePerspective(
    {
      context_address: SAMPLE_ADDRESS1,
      timestamp: 0,
      origin: 'local',
      name: 'master',
      creator: CREATOR_ADDRESS
    },
    buildProvenance(
      CREATOR_ADDRESS,
      'gGsg87N7yjW4iBP+AMsbIZXas+IEh668UgfgDFZJFh/tT6rTjOHiYhalZoUd6eBzBX8MxxGFYk6z/ZcaXA9sTAw=='
    )
  )(alice);
  t.equal(errorMessage.Err.Internal.includes('ValidationFailed'), true);
});

scenario1.runTape(
  'clone context, perspective and commit',
  async (t, { alice }) => {
    // Clone context
    const contextAddress = await cloneContext(
      buildContext(CREATOR_ADDRESS, 0, 0),
      buildProvenance(
        CREATOR_ADDRESS,
        '1UKVugll/HSeZ9pM9Je9z3Y3xFmSSZ3mprd4ObZnGZ91GEj6LqtjgCZavK19hUcqnJdxU+PBgjBPSYU3v0ZeCA=='
      )
    )(alice);
    t.equal(contextAddress, 'QmdyhNVV7AqBMriBKmCUUJq5hWDfz5ny3Syp2HNeSiWwvr');

    // Clone commit
    const commitAddress = await cloneCommit(
      buildCommit(SAMPLE_ADDRESS1, 0, 'commit messages', []),
      buildProvenance(
        CREATOR_ADDRESS,
        '3PdfvyQ0mn/kVC8B/yD0d1weT8rX4AmJE7oagmN/xPK4omsXFp4gKLkPo+65cjtOpE3G3FuTnS0jpaYtwCuIBg=='
      )
    )(alice);
    t.equal(commitAddress, 'QmWCtDCnbHXhkccaUQeSfsbrPHTvgascdeASSJ1UbvVu2J');

    // Clone perspective
    const perspectiveAddress = await clonePerspective(
      {
        context_address: contextAddress,
        timestamp: 0,
        origin: 'local',
        name: 'master',
        creator: CREATOR_ADDRESS
      },
      buildProvenance(
        CREATOR_ADDRESS,
        'gGsg87N7yjW4iBP+AMbIZXas+IEh668UgfgDFZJFh/tT6rTjOHiYhalZoUd6eBzBX8MxxGFYk6z/ZcaXA9sTAw=='
      )
    )(alice);
    t.equal(
      perspectiveAddress,
      'QmZtLZjF9HoRkLUnhAJE6ZjULZNLP6DZKLE1ZcYcFbTfAe'
    );
  }
);
