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

scenario1.runTape('create context', async (t, { alice }) => {
  // Make a call to a Zome function
  // indicating the capability and function, and passing it an input
  const contextAddress = alice.call('vc', 'create_context', {
    name: 'myNewContext'
  });

  t.equal(contextAddress.Ok, 'QmXA9hq87xLVqs4EgrzVZ5hRmaaiYUxpUB9J77GeQ5A2en');

  const result = alice.call('vc', 'get_context_info', {
    context_address: contextAddress.Ok
  });

  const contextInfo = JSON.parse(result.Ok.App[1]);

  // check for equality of the actual and expected results
  t.equal(contextInfo.name, 'myNewContext');
});

scenario1.runTape(
  'create two commits in master branch',
  async (t, { alice }) => {
    // Make a call to a Zome function
    // indicating the capability and function, and passing it an input
    const contextAddress = await alice.callSync('vc', 'create_context', {
      name: 'myNewContext'
    });
    t.equal(
      contextAddress.Ok,
      'QmXA9hq87xLVqs4EgrzVZ5hRmaaiYUxpUB9J77GeQ5A2en'
    );

    const branchAddress = alice.call('vc', 'get_context_branches', {
      context_address: contextAddress.Ok
    });
    t.equal(branchAddress.Ok.addresses[0], 'QmdYFTXuTyuaXbyLAPHmemgkjsaVQ5tfpnLqY9on5JZmzR');

    const firstCommitAddress = await alice.callSync('vc', 'create_commit', {
      branch_address: branchAddress.Ok.addresses[0],
      message: 'first commit',
      content: {
        ContentBlob: {
          content: {
            HolochainEntry: {
              dna_address: 'QmXA9hq87xLVqs4EgrzVZ5hRmaaiYUxpUB9J77GeQ5A2en',
              entry_address: 'QmXA9hq87xLVqs4EgrzVZ5hRmaaiYUxpUB9J77GeQ5A2en'
            }
          }
        }
      }
    });
    t.equal(
      firstCommitAddress.Ok,
      'QmNgSzUcfn5jECm4SSACdSsgDXeMSMJCgYmE64Z5ghFx8Y'
    );

    const branchHead = alice.call('vc', 'get_branch_head', {
      branch_address: branchAddress.Ok.addresses[0]
    });
    t.equal(branchHead.Ok.addresses[0], firstCommitAddress.Ok);

    const secondCommitAddress = await alice.callSync('vc', 'create_commit', {
      branch_address: branchAddress.Ok.addresses[0],
      message: 'second commit',
      content: {
        ContentBlob: {
          content: {
            HolochainEntry: {
              dna_address: 'QmXA9hq87xLVqs4EgrzVZ5hRmaaiYUxpUB9J77GeQ5A2en',
              entry_address: 'QmXA9hq87xLVqs4EgrzVZ5hRmaaiYUxpUB9J77GeQ5A2en'
            }
          }
        }
      }
    });
    t.equal(
      secondCommitAddress.Ok,
      'QmSypeps1AtQtSXBvShrywYUPZp8ZazobxDEeNDS2DrJim'
    );

    const commitInfoJsonString = alice.call('vc', 'get_commit_info', {
      commit_address: secondCommitAddress.Ok
    });

    const commitInfo = JSON.parse(commitInfoJsonString.Ok.App[1]);
    t.equal(commitInfo.context_address, contextAddress.Ok);
    t.equal(commitInfo.parent_commits_addresses[0], firstCommitAddress.Ok);

    const commitJsonString = alice.call('vc', 'get_commit_content', {
      commit_address: secondCommitAddress.Ok
    });

    const commitContent = JSON.parse(commitJsonString.Ok.App[1]);
    t.equal(
      commitContent.content.HolochainEntry.entry_address,
      'QmXA9hq87xLVqs4EgrzVZ5hRmaaiYUxpUB9J77GeQ5A2en'
    );
    t.equal(
      commitContent.content.HolochainEntry.entry_address,
      'QmXA9hq87xLVqs4EgrzVZ5hRmaaiYUxpUB9J77GeQ5A2en'
    );
  }
);

scenario1.runTape(
  'create a branch and a commit in it',
  async (t, { alice }) => {
    // Make a call to a Zome function
    // indicating the capability and function, and passing it an input
    const contextAddress = await alice.callSync('vc', 'create_context', {
      name: 'myNewContext'
    });

    const branchAddress = alice.call('vc', 'get_context_branches', {
      context_address: contextAddress.Ok
    });

    const firstCommitAddress = await alice.callSync('vc', 'create_commit', {
      branch_address: branchAddress.Ok.addresses[0],
      message: 'first commit',
      content: {
        ContentBlob: {
          content: {
            HolochainEntry: {
              dna_address: 'QmXA9hq87xLVqs4EgrzVZ5hRmaaiYUxpUB9J77GeQ5A2en',
              entry_address: 'QmXA9hq87xLVqs4EgrzVZ5hRmaaiYUxpUB9J77GeQ5A2en'
            }
          }
        }
      }
    });

    const developBranchAddress = await alice.callSync('vc', 'create_branch_in_context', {
      commit_address: firstCommitAddress.Ok,
      name: 'develop'
    });
    t.equal(
      developBranchAddress.Ok,
      'QmRqn5F3J3uL8NRoCugfNJF8556cp1khZJAP1XAdVdL73S'
    );

    const developBranchJson = alice.call('vc', 'get_branch_info', {
      branch_address: developBranchAddress.Ok
    });
    const developBranchInfo = JSON.parse(developBranchJson.Ok.App[1]);
    t.equal(developBranchInfo.context_address, contextAddress.Ok);

    const branches = alice.call('vc', 'get_context_branches', {
      context_address: contextAddress.Ok
    });
    t.deepEqual(branches.Ok.addresses, [branchAddress.Ok.addresses[0], developBranchAddress.Ok]);
  }
);
