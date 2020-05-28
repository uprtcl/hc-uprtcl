const SAMPLE_ADDRESS = 'QmXA9hq87xLVqs4EgrzVZ5hRmaaiYUxpUB9J77GeQ5A2en';
const SOURCES = ['ipfs://', 'http://collective.org'];

module.exports = scenario => {
  scenario('get own source', async (s, t, { alice }) => {
    const { Ok: ownSource } = await alice.call('uprtcl', 
      'discovery',
      'get_own_source',
      {}
    );
    t.equal(ownSource.includes('holochain://'), true);
  });

  scenario(
    'unknown address returns no known sources',
    async (s, t, { alice }) => {
      const knownSources = await alice.call('uprtcl', 
        'discovery',
        'get_known_sources',
        {
          address: SAMPLE_ADDRESS
        }
      );
      t.equal(knownSources.Ok.length, 0);
    }
  );

  scenario('add known source for an address', async (s, t, { alice }) => {
    await alice.call('uprtcl', 'discovery', 'add_known_sources', {
      address: SAMPLE_ADDRESS,
      sources: SOURCES
    });

    const knownSources = await alice.call('uprtcl', 
      'discovery',
      'get_known_sources',
      {
        address: SAMPLE_ADDRESS
      }
    );
    t.deepEqual(knownSources.Ok, SOURCES);
  });

  scenario('remove known source for an address', async (s, t, { alice }) => {
    await alice.call('uprtcl', 'discovery', 'add_known_sources', {
      address: SAMPLE_ADDRESS,
      sources: SOURCES
    });

    await alice.call('uprtcl', 'discovery', 'remove_known_source', {
      address: SAMPLE_ADDRESS,
      source: SOURCES[0]
    });

    const knownSources = await alice.call('uprtcl', 
      'discovery',
      'get_known_sources',
      {
        address: SAMPLE_ADDRESS
      }
    );
    t.deepEqual(knownSources.Ok, [SOURCES[1]]);
  });
};
