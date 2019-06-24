const SAMPLE_ADDRESS = 'QmXA9hq87xLVqs4EgrzVZ5hRmaaiYUxpUB9J77GeQ5A2en';
const SAMPLE_LENS = 'lens';

module.exports = scenario => {
  scenario('initially get lens returns null', async (s, t, { alice }) => {
    const lens = await alice.callSync('lens', 'get_lens', {
      entry_address: SAMPLE_ADDRESS
    });
    t.equal(lens.Ok, null);
  });

  scenario('set lens and then retrieve it', async (s, t, { alice }) => {
    await alice.callSync('lens', 'set_lens', {
      entry_address: SAMPLE_ADDRESS,
      lens: SAMPLE_LENS
    });
    const lens = await alice.callSync('lens', 'get_lens', {
      entry_address: SAMPLE_ADDRESS
    });
    t.equal(lens.Ok.lens, SAMPLE_LENS);
  });

  scenario(
    "get lens retrieves another user's lens if that user did not set any",
    async (s, t, { alice, bob }) => {
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
};
