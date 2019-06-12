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
const scenario2 = new Scenario([instanceAlice, instanceBob]);

const SAMPLE_ADDRESS = 'QmXA9hq87xLVqs4EgrzVZ5hRmaaiYUxpUB9J77GeQ5A2en';
const SAMPLE_LENS = 'lens';

scenario1.runTape('initially get lens returns null', async (t, { alice }) => {
  const lens = await alice.callSync('lens', 'get_lens', {
    entry_address: SAMPLE_ADDRESS
  });
  t.equal(lens.Ok, null);
});

scenario1.runTape('set lens and then retrieve it', async (t, { alice }) => {
  await alice.callSync('lens', 'set_lens', {
    entry_address: SAMPLE_ADDRESS,
    lens: SAMPLE_LENS
  });
  const lens = await alice.callSync('lens', 'get_lens', {
    entry_address: SAMPLE_ADDRESS
  });
  t.equal(lens.Ok.lens, SAMPLE_LENS);
});

scenario2.runTape(
  "get lens retrieves another user's lens if that user did not set any",
  async (t, { alice, bob }) => {
    await alice.callSync('lens', 'set_lens', {
      entry_address: SAMPLE_ADDRESS,
      lens: SAMPLE_LENS
    });
    const lens = await bob.callSync('lens', 'get_lens', {
      entry_address: SAMPLE_ADDRESS
    });
    t.equal(lens.Ok.lens, SAMPLE_LENS);
  }
);
