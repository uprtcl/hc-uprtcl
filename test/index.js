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

test('create content', async t => {
  // Make a call to a Zome function
  // indicating the capability and function, and passing it an input
  const newContextAddress = alice.call('vc', 'main', 'create_context', {
    name: 'myNewContext'
  });

  const result = alice.call('vc', 'main', 'get_context_info', {
    context_address: newContextAddress.Ok
  });

  const contextInfo = JSON.parse(result.Ok.App[1]);

  // check for equality of the actual and expected results
  t.equal(contextInfo.name, 'myNewContext');

  // ends this test
  t.end();
});
