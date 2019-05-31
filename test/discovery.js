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
const SOURCES = ['ipfs://', 'http://collective.org'];

scenario1.runTape('get own source', async (t, { alice }) => {
  const { Ok: ownSource } = await alice.callSync(
    'discovery',
    'get_own_source',
    {}
  );
  t.equal(ownSource.includes('holochain://'), true);
});

scenario1.runTape(
  'unknown address returns no known sources',
  async (t, { alice }) => {
    const knownSources = await alice.callSync(
      'discovery',
      'get_known_sources',
      {
        address: SAMPLE_ADDRESS
      }
    );
    t.equal(knownSources.Ok.length, 0);
  }
);

scenario1.runTape('add known source for an address', async (t, { alice }) => {
  await alice.callSync('discovery', 'add_known_sources', {
    address: SAMPLE_ADDRESS,
    sources: SOURCES
  });

  const knownSources = await alice.callSync('discovery', 'get_known_sources', {
    address: SAMPLE_ADDRESS
  });
  t.deepEqual(knownSources.Ok, SOURCES);
});

scenario1.runTape(
  'remove known source for an address',
  async (t, { alice }) => {
    await alice.callSync('discovery', 'add_known_sources', {
      address: SAMPLE_ADDRESS,
      sources: SOURCES
    });

    await alice.callSync('discovery', 'remove_known_source', {
      address: SAMPLE_ADDRESS,
      source: SOURCES[0]
    });

    const knownSources = await alice.callSync(
      'discovery',
      'get_known_sources',
      {
        address: SAMPLE_ADDRESS
      }
    );
    t.deepEqual(knownSources.Ok, [SOURCES[1]]);
  }
);
