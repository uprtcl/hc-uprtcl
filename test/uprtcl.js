// Utils variables to facilitate testing code
const {
  getEntry,
  createPerspective,
  getContextPerspectives,
  getPerspectiveDetails,
  updatePerspectiveDetails,
  createCommit,
  createCommitInPerspective,
  createNewPerspectiveAndCommit,
  buildPerspective,
  buildCommit,
  buildProvenance,
  parseEntryResult,
} = require("./utils");

const SAMPLE_ADDRESS1 = "QmXA9hq87xLVqs4EgrzVZ5hRmaaiYUxpUB9J77GeQ5A2en";
const SAMPLE_ADDRESS2 = "QmePeufDdo28ZcPnXhMJqCEEPPwDqq5yeqnCErQfd37UgE";

module.exports = (orchestrator, config) => {
  orchestrator.registerScenario(
    "create perspective with proxy addresses",
    async (s, t) => {
      const { alice } = await s.players({ alice: config }, true);

      // Create perspective pointing proxy addresses
      const perspectiveAddress = await createPerspective()(alice);
      await s.consistency();

      // Check that context has a perspective associated
      t.equal(perspectiveAddress.startsWith("Qm"), true);

      // Update perspective context
      let result = await updatePerspectiveDetails(perspectiveAddress, {
        context: "proxy1",
        name: "develop",
      })(alice);
      await s.consistency();
      t.equal(Object.keys(result).includes("Ok"), true);

      // Update perspective head
      result = await updatePerspectiveDetails(perspectiveAddress, {
        head: SAMPLE_ADDRESS2,
      })(alice);
      t.equal(Object.keys(result).includes("Ok"), true);
    }
  );

  orchestrator.registerScenario(
    "create two commits in master perspective",
    async (s, t) => {
      const { alice } = await s.players({ alice: config }, true);

      const aliceAddress = alice.instance("uprtcl").agentAddress;

      // Create new context, perspective and commit
      const {
        perspectiveAddress,
        commitAddress,
        context,
      } = await createNewPerspectiveAndCommit(
        "Commit message",
        SAMPLE_ADDRESS1,
        "master"
      )(alice);
      await s.consistency();

      // Check that the context has one perspective named master
      const perspectives = await getContextPerspectives(context)(alice);
      t.equal(perspectives.length, 1);
      t.equal(perspectives[0], perspectiveAddress);

      const masterAddress = perspectives[0];

      // Check that the perspective points to the previously defined commit
      const { head: perspectiveHead } = await getPerspectiveDetails(
        masterAddress
      )(alice);
      // ... and check the commit's structure
      const commitInfo = await getEntry(perspectiveHead)(alice);
      t.equal(commitInfo.payload.parentsIds.length, 0);
      t.equal(commitInfo.payload.creatorsIds[0], aliceAddress);
      t.equal(commitInfo.payload.dataId, SAMPLE_ADDRESS1);
      t.equal(commitInfo.payload.message, "Commit message");

      // Create second commit
      const secondCommitAddress = await createCommit(
        SAMPLE_ADDRESS2,
        [commitAddress],
        "second commit"
      )(alice);
      await s.consistency();

      // Update perspective head
      await updatePerspectiveDetails(masterAddress, {
        head: secondCommitAddress,
      })(alice);
      await s.consistency();

      // Check that now master points to the new commit
      // Double call to avoid network synchronization issues
      let { head: perspectiveHead2 } = await getPerspectiveDetails(
        masterAddress
      )(alice);
      t.equal(perspectiveHead2, secondCommitAddress);

      // Check that parent commit of the second commit is the first commit
      const secondCommitInfo = await getEntry(secondCommitAddress)(alice);
      t.equal(secondCommitInfo.payload.parentsIds[0], perspectiveHead);
      // Check new commits content and its content is the new content
      t.equal(secondCommitInfo.payload.dataId, SAMPLE_ADDRESS2);
    }
  );

  orchestrator.registerScenario(
    "create a develop perspective and a commit in it",
    async (s, t) => {
      const { alice } = await s.players({ alice: config }, true);

      // Create new context, perspective and commit
      const {
        perspectiveAddress,
        commitAddress,
        context,
      } = await createNewPerspectiveAndCommit(
        "Commit message",
        SAMPLE_ADDRESS1,
        "master"
      )(alice);
      await s.consistency();

      // Create another perspective pointing to the initial commit
      const developAddress = await createPerspective()(alice);
      await s.consistency();

      const result = await updatePerspectiveDetails(developAddress, {
        context,
      })(alice);
      t.equal(Object.keys(result).includes("Ok"), true);
      await s.consistency();

      // Check perspective info
      const developPerspective = await getEntry(developAddress)(alice);
      t.ok(developPerspective.payload);

      const perspectives = await getContextPerspectives(context)(alice);

      // Check that the context now has the two correct perspectives
      t.equal(perspectives[0], developAddress);
      t.equal(perspectives[1], perspectiveAddress);

      // Set perspective head
      await updatePerspectiveDetails(developAddress, { head: commitAddress })(
        alice
      );
      await s.consistency();

      // Check that the newly created perspective points to the correct commit
      const { head: perspectiveHead } = await getPerspectiveDetails(
        developAddress
      )(alice);
      t.equal(perspectiveHead, commitAddress);

      // Create second commit in the develop perspective
      const secondCommitAddress = await createCommitInPerspective(
        developAddress,
        "second commit",
        SAMPLE_ADDRESS2
      )(alice);
      await s.consistency();

      // Check that master still points to the first commit
      const { head: perspectiveHead2 } = await getPerspectiveDetails(
        perspectiveAddress
      )(alice);
      t.equal(perspectiveHead2, commitAddress);

      // Check that develop now points to the newly created commit
      const { head: perspectiveHead3 } = await getPerspectiveDetails(
        developAddress
      )(alice);
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
