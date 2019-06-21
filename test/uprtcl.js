// Utils variables to facilitate testing code
const {
  getEntry,
  createContext,
  createPerspective,
  getRootContextId,
  getContextPerspectives,
  getPerspectiveHead,
  updatePerspectiveHead,
  createCommit,
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

module.exports = scenario => {

  scenario('create context', async (s, t, { alice }) => {
    // Create context
    const contextAddress = await createContext(buildContext())(alice);

    const result = await getEntry(contextAddress)(alice);

    // Check that context creator is correct
    t.equal(result.creatorId, CREATOR_ADDRESS);

    // check that context has a perspective associated
    const perspectives = await getContextPerspectives(contextAddress)(alice);
    t.equal(perspectives.length, 0);
  });

  scenario('create perspective with proxy addresses', async (s, t, { alice }) => {
    // Create perspective pointing proxy addresses
    const perspective = buildPerspective('develop', 'proxy1');
    const perspectiveAddress = await createPerspective(perspective)(alice);
    // check that context has a perspective associated
    t.equal(perspectiveAddress.startsWith('Qm'), true);

    const result = await updatePerspectiveHead(perspectiveAddress, 'proxy2')(
      alice
    );
    t.equal(Object.keys(result).includes('Ok'), true);
  });

  scenario('create two commits in master perspective', async (s, t, { alice }) => {
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
    t.equal(perspectives, 1);
    t.equal(perspectives.length, 1);
    t.equal(perspectives[0].name, 'master');

    const masterAddress = perspectives[0].id;

    // Check that the perspective points to the previously defined commit
    const perspectiveHead = await getPerspectiveHead(masterAddress)(alice);
    // ... and check the commit's structure
    const commitInfo = getEntry(perspectiveHead)(alice);
    t.equal(commitInfo.parentsIds.length, 0);
    t.equal(commitInfo.creatorId, CREATOR_ADDRESS);
    t.equal(commitInfo.dataId, SAMPLE_ADDRESS1);
    t.equal(commitInfo.message, 'Commit message');

    // Create second commit
    const commit = buildCommit(SAMPLE_ADDRESS2, 'second commit', [
      commitAddress
    ]);
    const secondCommitAddress = await createCommit(commit)(alice);

    // Update perspective head
    await updatePerspectiveHead(masterAddress, secondCommitAddress)(alice);

    // Check that now master points to the new commit
    // Double call to avoid network synchronization issues
    let perspectiveHead2 = await getPerspectiveHead(masterAddress)(alice);
    perspectiveHead2 = await getPerspectiveHead(masterAddress)(alice);
    t.equal(perspectiveHead2, secondCommitAddress);

    // Check that parent commit of the second commit is the first commit
    const secondCommitInfo = getEntry(secondCommitAddress)(alice);
    t.equal(secondCommitInfo.parentsIds[0], perspectiveHead);
    // Check new commits content and its content is the new content
    t.equal(secondCommitInfo.dataId, SAMPLE_ADDRESS2);
  });

  scenario(
    'create a develop perspective and a commit in it',
    async (s, t, { alice }) => {
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
      const perspective = buildPerspective('develop', contextAddress);
      const developAddress = await createPerspective(perspective)(alice);

      // Check perspective info
      const developPerspective = getEntry(developAddress)(alice);
      t.equal(developPerspective.name, 'develop');
      t.equal(developPerspective.contextId, contextAddress);

      // Check that the context now has the two correct perspectives
      const perspectives = await getContextPerspectives(contextAddress)(alice);
      t.equal(perspectives[0].id, perspectiveAddress);
      t.equal(perspectives[1].id, developAddress);

      // Set perspective head
      await updatePerspectiveHead(developAddress, commitAddress)(alice);

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
  /* 
scenario('create with invalid provenance fails', async (s, t, { alice }) => {
  // create context
  let errorMessage = await createContext(
    buildContext(CREATOR_ADDRESS, 0, 0),
    buildProvenance(
      CREATOR_ADDRESS,
      '1UKVugll/HSeZ9pM9Je9z3Y3xFmSSsZ3mprd4ObZnGZ91GEj6LqtjgCZavK19hUcqnJdxU+PBgjBPSYU3v0ZeCA=='
    )
  )(alice);
  t.equal(errorMessage.Err.Internal.includes('ValidationFailed'), true);

  // create commit
  errorMessage = await createCommit(
    buildCommit(SAMPLE_ADDRESS1, 0, 'commit messages', []),
    buildProvenance(
      CREATOR_ADDRESS,
      '3PdfvyQ0mn/kVC8B/yD0d1weT8rXs4AmJE7oagmN/xPK4omsXFp4gKLkPo+65cjtOpE3G3FuTnS0jpaYtwCuIBg=='
    )
  )(alice);
  t.equal(errorMessage.Err.Internal.includes('ValidationFailed'), true);

  // create perspective
  errorMessage = await createPerspective(
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

scenario(
  'create with valid custom provenance context, perspective and commit',
  async (s, t, { alice }) => {
    // create context
    const contextAddress = await createContext(
      buildContext(CREATOR_ADDRESS, 0, 0),
      buildProvenance(
        CREATOR_ADDRESS,
        '1UKVugll/HSeZ9pM9Je9z3Y3xFmSSZ3mprd4ObZnGZ91GEj6LqtjgCZavK19hUcqnJdxU+PBgjBPSYU3v0ZeCA=='
      )
    )(alice);
    t.equal(contextAddress, 'QmdyhNVV7AqBMriBKmCUUJq5hWDfz5ny3Syp2HNeSiWwvr');

    // create commit
    const commitAddress = await createCommit(
      buildCommit(SAMPLE_ADDRESS1, 0, 'commit messages', []),
      buildProvenance(
        CREATOR_ADDRESS,
        '3PdfvyQ0mn/kVC8B/yD0d1weT8rX4AmJE7oagmN/xPK4omsXFp4gKLkPo+65cjtOpE3G3FuTnS0jpaYtwCuIBg=='
      )
    )(alice);
    t.equal(commitAddress, 'QmWCtDCnbHXhkccaUQeSfsbrPHTvgascdeASSJ1UbvVu2J');

    // create perspective
    const perspectiveAddress = await createPerspective(
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
 */
};
