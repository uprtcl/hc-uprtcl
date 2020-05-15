const SAMPLE_ADDRESS = 'QmXA9hq87xLVqs4EgrzVZ5hRmaaiYUxpUB9J77GeQ5A2en';
const SAMPLE_DRAFT_CONTENT1 = {
  sampleContent1: 'sampleContent1'
};
const SAMPLE_DRAFT_CONTENT2 = {
  sampleContent2: 'sampleContent2'
};

module.exports = scenario => {
  scenario('get non-existing draft', async (s, t, { alice }) => {
    const draft = await alice.call('uprtcl', 'draft', 'get_draft', {
      entry_address: SAMPLE_ADDRESS
    });
    t.equal(draft.Ok.message, 'entry has no drafts');
  });

  scenario('set draft null', async (s, t, { alice }) => {
    let draftAddress = await alice.call('uprtcl', 'draft', 'set_draft', {
      entry_address: SAMPLE_ADDRESS,
      draft: JSON.stringify(SAMPLE_DRAFT_CONTENT1)
    });
    draftAddress = await alice.call('uprtcl', 'draft', 'set_draft', {
      entry_address: SAMPLE_ADDRESS,
      draft: null
    });
    t.equal(draftAddress.Ok, null);

    const draft = await alice.call('uprtcl', 'draft', 'get_draft', {
      entry_address: SAMPLE_ADDRESS
    });
    t.deepEqual(draft.Ok.message, 'entry has no drafts');
  });

  scenario('set draft and get it afterwards', async (s, t, { alice }) => {
    const draftAddress = await alice.call('uprtcl', 'draft', 'set_draft', {
      entry_address: SAMPLE_ADDRESS,
      draft: JSON.stringify(SAMPLE_DRAFT_CONTENT1)
    });
    t.equal(draftAddress.Ok, null);

    const draft = await alice.call('uprtcl', 'draft', 'get_draft', {
      entry_address: SAMPLE_ADDRESS
    });
    t.deepEqual(draft.Ok, SAMPLE_DRAFT_CONTENT1);
  });

  scenario(
    'set different drafts to the same entry address',
    async (s, t, { alice }) => {
      let draftAddress = await alice.call('uprtcl', 'draft', 'set_draft', {
        entry_address: SAMPLE_ADDRESS,
        draft: JSON.stringify(SAMPLE_DRAFT_CONTENT1)
      });
      t.equal(draftAddress.Ok, null);
      draftAddress = await alice.call('uprtcl', 'draft', 'set_draft', {
        entry_address: SAMPLE_ADDRESS,
        draft: JSON.stringify(SAMPLE_DRAFT_CONTENT2)
      });
      t.equal(draftAddress.Ok, null);
    }
  );

  scenario('set draft duplicated is fine', async (s, t, { alice }) => {
    let draftAddress = await alice.call('uprtcl', 'draft', 'set_draft', {
      entry_address: SAMPLE_ADDRESS,
      draft: JSON.stringify(SAMPLE_DRAFT_CONTENT1)
    });
    draftAddress = await alice.call('uprtcl', 'draft', 'set_draft', {
      entry_address: SAMPLE_ADDRESS,
      draft: JSON.stringify(SAMPLE_DRAFT_CONTENT1)
    });
    t.equal(draftAddress.Ok, null);
  });

  scenario(
    'drafts from different people do not conflict',
    async (s, t, { alice, bob }) => {
      const aliceDraftAddress = await alice.call('uprtcl', 'draft', 'set_draft', {
        entry_address: SAMPLE_ADDRESS,
        draft: JSON.stringify(SAMPLE_DRAFT_CONTENT1)
      });
      t.equal(aliceDraftAddress.Ok, null);

      const noDraft = await bob.call('uprtcl', 'draft', 'get_draft', {
        entry_address: SAMPLE_ADDRESS
      });
      t.equal(noDraft.Ok.message, 'entry has no drafts');

      const bobDraftAddress = await bob.call('uprtcl', 'draft', 'set_draft', {
        entry_address: SAMPLE_ADDRESS,
        draft: JSON.stringify(SAMPLE_DRAFT_CONTENT2)
      });
      t.equal(bobDraftAddress.Ok, null);

      const bobDraft = await bob.call('uprtcl', 'draft', 'get_draft', {
        entry_address: SAMPLE_ADDRESS
      });
      t.deepEqual(bobDraft.Ok, SAMPLE_DRAFT_CONTENT2);
    }
  );
};
