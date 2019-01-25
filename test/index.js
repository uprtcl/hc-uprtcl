const path = require('path');
const test = require('tape');

const { Config, Container } = require('@holochain/holochain-nodejs');

const dnaPath = path.join(__dirname, '../dist/bundle.json');
const dna = Config.dna(dnaPath);
const agentAlice = Config.agent('alice');
const agentBob = Config.agent('bob');

const instanceAlice = Config.instance(agentAlice, dna);
const instanceBob = Config.instance(agentBob, dna);

const config = Config.container([instanceAlice, instanceBob]);
const container = new Container(config);

container.start();
const alice = container.makeCaller('alice', dnaPath);

test('create context', async t => {
  // Make a call to a Zome function
  // indicating the capability and function, and passing it an input
  const contextAddress = alice.call('vc', 'main', 'create_context', {
    name: 'myNewContext'
  });

  t.equal(
    contextAddress.Ok,
    'QmXA9hq87xLVqs4EgrzVZ5hRmaaiYUxpUB9J77GeQ5A2en'
  );

  const result = alice.call('vc', 'main', 'get_context_info', {
    context_address: contextAddress.Ok
  });

  const contextInfo = JSON.parse(result.Ok.App[1]);

  // check for equality of the actual and expected results
  t.equal(contextInfo.name, 'myNewContext');

  // ends this test
  t.end();
});

test('create two commits in master branch', async t => {
  // Make a call to a Zome function
  // indicating the capability and function, and passing it an input
  const contextAddress = alice.call('vc', 'main', 'create_context', {
    name: 'myNewContext'
  }).Ok;

  const branchAddress = alice.call('vc', 'main', 'get_context_branches', {
    context_address: contextAddress
  }).Ok.addresses[0];
  t.equal(branchAddress, 'QmdYFTXuTyuaXbyLAPHmemgkjsaVQ5tfpnLqY9on5JZmzR');

  const firstCommitAddress = alice.call('vc', 'main', 'create_commit', {
    branch_address: branchAddress,
    message: 'first commit',
    content: {
      ContentBlob: {
        content: {
          HolochainEntry: {
            dna_address: contextAddress,
            entry_address: contextAddress
          }
        }
      }
    }
  }).Ok;
  t.equal(firstCommitAddress, 'QmNgSzUcfn5jECm4SSACdSsgDXeMSMJCgYmE64Z5ghFx8Y');
  
  const branchHead = alice.call('vc', 'main', 'get_branch_head', {
    branch_address: branchAddress
  });
  t.equal(branchHead, firstCommitAddress);
  
  const secondCommitAddress = alice.call('vc', 'main', 'create_commit', {
    branch_address: branchAddress,
    message: 'second commit',
    content: {
      ContentBlob: {
        content: {
          HolochainEntry: {
            dna_address: branchAddress,
            entry_address: branchAddress
          }
        }
      }
    }
  }).Ok;
  t.equal(secondCommitAddress, 'Qmdo6BvLWcskWRCixnhH79LKywy19sZtDY5NkdXALen9xP');
  
  const commitInfoJsonString = alice.call('vc', 'main', 'get_commit_info', {
    commit_address: secondCommitAddress
  });

  const commitInfo = JSON.parse(commitInfoJsonString.Ok.App[1]);
  t.equal(commitInfo.context_address, contextAddress);
  t.equal(commitInfo, firstCommitAddress);
  
  const commitJsonString = alice.call('vc', 'main', 'get_commit_content', {
    commit_address: secondCommitAddress
  });

  const commitContent = JSON.parse(commitJsonString.Ok.App[1]);
  t.equal(commitContent.content.HolochainEntry.dna_address, 'QmdYFTXuTyuaXbyLAPHmemgkjsaVQ5tfpnLqY9on5JZmzR');
  t.equal(commitContent.content.HolochainEntry.entry_address, 'QmdYFTXuTyuaXbyLAPHmemgkjsaVQ5tfpnLqY9on5JZmzR');

  t.end();
});


test('create a branch and a commit in it', async t => {
  // Make a call to a Zome function
  // indicating the capability and function, and passing it an input
  const contextAddress = alice.call('vc', 'main', 'create_context', {
    name: 'myNewContext'
  }).Ok;

  const branchAddress = alice.call('vc', 'main', 'get_context_branches', {
    context_address: contextAddress
  }).Ok.addresses[0];
  
  const firstCommitAddress = alice.call('vc', 'main', 'create_commit', {
    branch_address: branchAddress,
    message: 'first commit',
    content: {
      ContentBlob: {
        content: {
          HolochainEntry: {
            dna_address: contextAddress,
            entry_address: contextAddress
          }
        }
      }
    }
  }).Ok;
  
  const developBranchAddress = alice.call('vc', 'main', 'create_branch_in_context', {
    commit_address: firstCommitAddress,
    name: 'develop'
  }).Ok;
  t.equal(developBranchAddress, 'QmRqn5F3J3uL8NRoCugfNJF8556cp1khZJAP1XAdVdL73S');
  
  const developBranchJson = alice.call('vc', 'main', 'get_branch_info', {
    branch_address: developBranchAddress
  });
  const developBranchInfo = JSON.parse(developBranchJson.Ok.App[1]);
  t.equal(developBranchInfo.context_address, contextAddress);

  const branches = alice.call('vc', 'main', 'get_context_branches', {
    context_address: contextAddress
  }).Ok;
  t.equal(branches, 'QmRqn5F3J3uL8NRoCugfNJF8556cp1khZJAP1XAdVdL73S');

  t.end();
});
