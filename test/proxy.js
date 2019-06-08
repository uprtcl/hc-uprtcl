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

const SAMPLE_ADDRESS = 'QmXA9hq87xLVqs4EgrzVZ5hRmaaiYUxpUB9J77GeQ5A2en';

scenario1.runTape('set a proxy for a null entry', async (t, { alice }) => {
  const proxyEntryAddress = await alice.callSync(
    'proxy',
    'set_entry_proxy',
    {
      proxy_address: SAMPLE_ADDRESS,
      entry_address: null
    }
  );
  t.equal(proxyEntryAddress.Ok !== null, true);

  const proxyEntryAddress2 = await alice.callSync(
    'proxy',
    'set_entry_proxy',
    {
      proxy_address: SAMPLE_ADDRESS,
      entry_address: proxyEntryAddress.Ok
    }
  );
  t.equal(proxyEntryAddress2.Ok !== null, true);
});
