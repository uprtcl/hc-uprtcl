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

const SAMPLE_ENTRY_ADDRESS = 'QmXA9hq87xLVqs4EgrzVZ5hRmaaiYUxpUB9J77GeQ5A2en';
const SAMPLE_ENTRY_ADDRESS2 = 'QmXA9hq87xLVqs4EgrzVZ5hRmaaiYUxpUB9J77GeQ5A2ed';

scenario1.runTape('get non-existing workspace', async (t, { alice }) => {
  const workspace = await alice.callSync('workspace', 'get_my_workspace', {
    entry_address: SAMPLE_ENTRY_ADDRESS
  });
  t.equal(workspace.Ok, null);
});

scenario1.runTape(
  'get or create non-existing workspace should create a workspace',
  async (t, { alice }) => {
    const workspaceAddress1 = await alice.callSync(
      'workspace',
      'get_or_create_workspace',
      {
        entry_address: SAMPLE_ENTRY_ADDRESS
      }
    );
    t.equal(workspaceAddress1.Ok.startsWith('Qm'), true);

    const workspaceAddress2 = await alice.callSync(
      'workspace',
      'get_or_create_workspace',
      {
        entry_address: SAMPLE_ENTRY_ADDRESS
      }
    );
    t.equal(workspaceAddress1.Ok, workspaceAddress2.Ok);

    const workspaceAddress3 = await alice.callSync(
      'workspace',
      'get_my_workspace',
      {
        entry_address: SAMPLE_ENTRY_ADDRESS
      }
    );
    t.equal(workspaceAddress1.Ok, workspaceAddress3.Ok);
  }
);

scenario1.runTape(
  'different entries have different workspaces',
  async (t, { alice }) => {
    const workspaceAddress1 = await alice.callSync(
      'workspace',
      'get_or_create_workspace',
      {
        entry_address: SAMPLE_ENTRY_ADDRESS
      }
    );
    const workspaceAddress2 = await alice.callSync(
      'workspace',
      'get_or_create_workspace',
      {
        entry_address: SAMPLE_ENTRY_ADDRESS2
      }
    );
    t.notEqual(workspaceAddress1.Ok, workspaceAddress2.Ok);
  }
);

scenario2.runTape(
  'get all workspaces for the same entry',
  async (t, { alice, bob }) => {
    const aliceWorkspaceAddress = await alice.callSync(
      'workspace',
      'get_or_create_workspace',
      {
        entry_address: SAMPLE_ENTRY_ADDRESS
      }
    );

    const bobWorkspaceAddress = await bob.callSync(
      'workspace',
      'get_or_create_workspace',
      {
        entry_address: SAMPLE_ENTRY_ADDRESS
      }
    );

    const allWorkspaces = await bob.callSync(
      'workspace',
      'get_all_workspaces',
      { entry_address: SAMPLE_ENTRY_ADDRESS }
    );

    t.equal(allWorkspaces.Ok.length, 2);
    t.equal(allWorkspaces.Ok[0], aliceWorkspaceAddress.Ok);
    t.equal(allWorkspaces.Ok[1], bobWorkspaceAddress.Ok);
  }
);

scenario2.runTape(
  'workspaces for the same entry for different people are different',
  async (t, { alice, bob }) => {
    const aliceWorkspaceAddress = await alice.callSync(
      'workspace',
      'get_or_create_workspace',
      {
        entry_address: SAMPLE_ENTRY_ADDRESS
      }
    );

    const noWorkspace = await bob.callSync('workspace', 'get_my_workspace', {
      entry_address: SAMPLE_ENTRY_ADDRESS
    });
    t.equal(noWorkspace.Ok, null);

    const bobWorkspaceAddress = await bob.callSync(
      'workspace',
      'get_or_create_workspace',
      {
        entry_address: SAMPLE_ENTRY_ADDRESS
      }
    );
    t.equal(bobWorkspaceAddress.Ok.startsWith('Qm'), true);
    t.notEqual(aliceWorkspaceAddress.Ok, bobWorkspaceAddress.Ok);
  }
);
