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
  createContextAndCommit
} = require('./utils');

const DNA_ADDRESS = 'QmXA9hq87xLVqs4EgrzVZ5hRmaaiYUxpUB9J77GeQ5A2en';
const ENTRY_ADDRESS = 'QmXA9hq87xLVqs4EgrzVZ5hRmaaiYUxpUB9J77GeQ5A2en';

const commitArgs = message => ({
  message,
  dnaAddress: DNA_ADDRESS,
  entryAddress: ENTRY_ADDRESS
});

scenario1.runTape('create context', async (t, { alice }) => {
  // Make a call to a Zome function
  // indicating the capability and function, and passing it an input
  const { Ok: contextAddress } = await createContext(alice, 'myNewContext');
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
    const { Ok: contextAddress } = await createContext(alice, 'myNewContext');

    const {
      Ok: { addresses: branchAddresses }
    } = getContextBranches(alice, contextAddress);
    t.equal(
      branchAddresses[0],
      'QmdYFTXuTyuaXbyLAPHmemgkjsaVQ5tfpnLqY9on5JZmzR'
    );

    const { Ok: firstCommitAddress } = await createCommit(
      alice,
      branchAddresses[0],
      commitArgs('first commit')
    );
    t.equal(
      firstCommitAddress,
      'QmNgSzUcfn5jECm4SSACdSsgDXeMSMJCgYmE64Z5ghFx8Y'
    );

    const { Ok: branchHead } = alice.call('vc', 'get_branch_head', {
      branch_address: branchAddresses[0]
    });
    t.equal(branchHead, firstCommitAddress);

    const { Ok: secondCommitAddress } = await createCommit(
      alice,
      branchAddresses[0],
      commitArgs('second commit')
    );
    t.equal(
      secondCommitAddress,
      'QmSypeps1AtQtSXBvShrywYUPZp8ZazobxDEeNDS2DrJim'
    );

    const commitInfoJsonString = alice.call('vc', 'get_commit_info', {
      commit_address: secondCommitAddress
    });

    const commitInfo = JSON.parse(commitInfoJsonString.Ok.App[1]);
    t.equal(commitInfo.context_address, contextAddress);
    t.equal(commitInfo.parent_commits_addresses[0], firstCommitAddress);

    const commitJsonString = alice.call('vc', 'get_commit_content', {
      commit_address: secondCommitAddress
    });

    const commitContent = JSON.parse(commitJsonString.Ok.App[1]);
    t.equal(commitContent.content.HolochainEntry.dna_address, DNA_ADDRESS);
    t.equal(commitContent.content.HolochainEntry.entry_address, ENTRY_ADDRESS);
  }
);

scenario1.runTape(
  'create a develop branch and a commit in it',
  async (t, { alice }) => {
    const { contextAddress, commitAddress } = await createContextAndCommit(
      alice,
      'myNewContext',
      commitArgs('first commit')
    );

    const { Ok: developAddress } = await createBranch(
      alice,
      commitAddress,
      'develop'
    );
    t.equal(developAddress, 'QmRqn5F3J3uL8NRoCugfNJF8556cp1khZJAP1XAdVdL73S');

    const developBranchJson = alice.call('vc', 'get_branch_info', {
      branch_address: developAddress
    });
    const developBranchInfo = JSON.parse(developBranchJson.Ok.App[1]);
    t.equal(developBranchInfo.context_address, contextAddress);

    const {
      Ok: { addresses: branchAddresses }
    } = getContextBranches(alice, contextAddress);
    t.deepEqual(branchAddresses, [branchAddresses[0], developAddress]);
  }
);

scenario1.runTape('merge two branches', async (t, { alice }) => {
  const { masterAddress } = await createContextAndCommit(
    alice,
    'myNewContext',
    commitArgs('first commit')
  );

  const { Ok: ancestorCommitAddress } = await createNCommits(
    alice,
    4,
    masterAddress,
    commitArgs('master commit number ')
  );

  const { Ok: developAddress } = await createBranch(
    alice,
    ancestorCommitAddress,
    'develop'
  );

  await createNCommits(
    alice,
    10,
    masterAddress,
    commitArgs('master commit number ')
  );

  await createNCommits(
    alice,
    10,
    developAddress,
    commitArgs('develop commit number ')
  );

  const { Ok: mostRecentAncestor } = alice.call('vc', 'merge_branches', {
    from_branch_address: developAddress,
    to_branch_address: masterAddress
  });

  t.equal(mostRecentAncestor, ancestorCommitAddress);
});
