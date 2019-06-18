const SAMPLE_ENTRY_ADDRESS = 'QmXA9hq87xLVqs4EgrzVZ5hRmaaiYUxpUB9J77GeQ5A2en';
const SAMPLE_ENTRY_ADDRESS2 = 'QmXA9hq87xLVqs4EgrzVZ5hRmaaiYUxpUB9J77GeQ5A2ed';

module.exports = scenario => {
  scenario('get non-existing workspace', async (s, t, { alice }) => {
    const workspace = await alice.callSync('workspace', 'get_my_workspace', {
      entry_address: SAMPLE_ENTRY_ADDRESS
    });
    t.equal(workspace.Ok, null);
  });

  scenario(
    'get or create non-existing workspace should create a workspace',
    async (s, t, { alice }) => {
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

  scenario(
    'different entries have different workspaces',
    async (s, t, { alice }) => {
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

  scenario(
    'get all workspaces for the same entry',
    async (s, t, { alice, bob }) => {
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

  scenario(
    'workspaces for the same entry for different people are different',
    async (s, t, { alice, bob }) => {
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
};
