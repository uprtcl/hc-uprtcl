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

test('create repository', async t => {
  // Make a call to a Zome function
  // indicating the capability and function, and passing it an input
  const newRepoAddress = alice.call('vc', 'main', 'create_repository', {
    name: 'myNewRepository'
  });

  const result = alice.call('vc', 'main', 'get_repository_info', {
    repository_address: newRepoAddress.Ok
  });

  const repoInfo = JSON.parse(result.Ok.App[1]);

  // check for equality of the actual and expected results
  t.equal(repoInfo.name, 'myNewRepository');

  // ends this test
  t.end();
});
