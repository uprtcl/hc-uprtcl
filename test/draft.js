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
const SAMPLE_DRAFT_CONTENT1 = {
  sampleContent1: 'sampleContent1'
};
const SAMPLE_DRAFT_CONTENT2 = {
  sampleContent2: 'sampleContent2'
};

const { parseEntry } = require('./utils');

scenario1.runTape('get non-existing draft', async (t, { alice }) => {
  const draft = await alice.callSync('draft', 'get_draft', {
    entry_address: SAMPLE_ADDRESS
  });
  t.equal(draft.Ok.message, 'entry has no drafts');
});

scenario1.runTape('set draft and get it afterwards', async (t, { alice }) => {
  const draftAddress = await alice.callSync('draft', 'set_draft', {
    entry_address: SAMPLE_ADDRESS,
    draft: JSON.stringify(SAMPLE_DRAFT_CONTENT1)
  });
  t.equal(draftAddress.Ok, 'QmayiqV3JsC6YR8LdTMavqdnTrFMc8Ak2usQtcDQd2XUo4');

  const draft = await alice.callSync('draft', 'get_draft', {
    entry_address: SAMPLE_ADDRESS
  });
  t.deepEqual(draft.Ok, SAMPLE_DRAFT_CONTENT1);
});

scenario2.runTape(
  'drafts from different people do not conflict',
  async (t, { alice, bob }) => {
    const aliceDraftAddress = await alice.callSync('draft', 'set_draft', {
      entry_address: SAMPLE_ADDRESS,
      draft: JSON.stringify(SAMPLE_DRAFT_CONTENT1)
    });
    t.equal(
      aliceDraftAddress.Ok,
      'QmayiqV3JsC6YR8LdTMavqdnTrFMc8Ak2usQtcDQd2XUo4'
    );

    const noDraft = await bob.callSync('draft', 'get_draft', {
      entry_address: SAMPLE_ADDRESS
    });
    t.equal(noDraft.Ok.message, 'entry has no drafts');

    const bobDraftAddress = await bob.callSync('draft', 'set_draft', {
      entry_address: SAMPLE_ADDRESS,
      draft: JSON.stringify(SAMPLE_DRAFT_CONTENT2)
    });
    t.equal(
      bobDraftAddress.Ok,
      'QmXSBzWRrBujEKCrpArNmiFL1dbXfhUW3mkQ3SCx19uT26'
    );

    const bobDraft = await bob.callSync('draft', 'get_draft', {
      entry_address: SAMPLE_ADDRESS
    });
    t.deepEqual(bobDraft.Ok, SAMPLE_DRAFT_CONTENT2);
  }
);
