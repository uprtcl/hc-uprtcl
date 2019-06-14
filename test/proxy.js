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
const LINK_TYPE = 'internal_proxy';
// These are CID v1 addresses
const PROXY_ADDRESS1 = 'zb2rhe5P4gXftAwvA4eXQ5HJwsER2owDyS9sKaQRRVQPn93bA';
const PROXY_ADDRESS2 = 'z8mWaJHXieAVxxLagBpdaNWFEBKVWmMiE';

const createSampleEntry = async function(caller) {
  const entry = await caller.callSync('proxy', 'set_entry_proxy', {
    proxy_address: 'PROXY' + Date.now(),
    entry_address: null
  });
  return entry.Ok;
};

scenario1.runTape(
  'set a proxy for a null entry is ok',
  async (t, { alice }) => {
    const proxyEntryAddress = await alice.callSync('proxy', 'set_entry_proxy', {
      proxy_address: PROXY_ADDRESS1,
      entry_address: null
    });
    t.equal(proxyEntryAddress.Ok !== null, true);
  }
);

scenario1.runTape(
  'set a proxy for an internal entry is ok',
  async (t, { alice }) => {
    const proxyEntryAddress = await alice.callSync('proxy', 'set_entry_proxy', {
      proxy_address: PROXY_ADDRESS1,
      entry_address: SAMPLE_ADDRESS
    });
    t.equal(proxyEntryAddress.Ok !== null, true);
  }
);

scenario1.runTape(
  'set two proxies for the same entry is okey',
  async (t, { alice }) => {
    let proxyEntryAddress = await alice.callSync('proxy', 'set_entry_proxy', {
      proxy_address: PROXY_ADDRESS1,
      entry_address: SAMPLE_ADDRESS
    });
    t.equal(proxyEntryAddress.Ok !== null, true);
    proxyEntryAddress = await alice.callSync('proxy', 'set_entry_proxy', {
      proxy_address: PROXY_ADDRESS2,
      entry_address: SAMPLE_ADDRESS
    });
    t.equal(proxyEntryAddress.Ok !== null, true);
  }
);

scenario1.runTape('get proxied entry is ok', async (t, { alice }) => {
  // Create any entry in the app
  const entryAddress = await createSampleEntry(alice);

  await alice.callSync('proxy', 'set_entry_proxy', {
    proxy_address: PROXY_ADDRESS2,
    entry_address: entryAddress
  });
  const entry = await alice.callSync('proxy', 'get_proxied_entry', {
    address: PROXY_ADDRESS2
  });
  t.equal(entry.Ok.result.Single.meta.address, entryAddress);
});

scenario1.runTape('get internal address is ok', async (t, { alice }) => {
  // Create any entry in the app
  const entryAddress = await createSampleEntry(alice);

  await alice.callSync('proxy', 'set_entry_proxy', {
    proxy_address: PROXY_ADDRESS2,
    entry_address: entryAddress
  });
  const address = await alice.callSync('proxy', 'get_internal_address', {
    proxy_address: PROXY_ADDRESS2
  });
  t.equal(address.Ok, entryAddress);
});

scenario1.runTape('links to proxy is ok', async (t, { alice }) => {
  const sampleEntryAddress = await createSampleEntry(alice);

  // Create a ghost proxy
  await alice.callSync('proxy', 'set_entry_proxy', {
    proxy_address: PROXY_ADDRESS1,
    entry_address: null
  });
  // Create a link to said proxy
  await alice.callSync('proxy', 'link_to_proxy', {
    base_address: sampleEntryAddress,
    proxy_address: PROXY_ADDRESS1,
    link_type: LINK_TYPE,
    tag: ''
  });
  let links = await alice.callSync('proxy', 'get_links_to_proxy', {
    base_address: sampleEntryAddress,
    link_type: LINK_TYPE,
    tag: ''
  });
  t.equal(links.Ok.length, 1);

  // Create second ghost proxy
  await alice.callSync('proxy', 'set_entry_proxy', {
    proxy_address: PROXY_ADDRESS2,
    entry_address: null
  });
  // And a link also
  await alice.callSync('proxy', 'link_to_proxy', {
    base_address: sampleEntryAddress,
    proxy_address: PROXY_ADDRESS2,
    link_type: LINK_TYPE,
    tag: ''
  });

  // Actually, we now know that both proxies identify the same entry
  const proxiedEntryAddress = await createSampleEntry(alice);
  await alice.callSync('proxy', 'set_entry_proxy', {
    proxy_address: PROXY_ADDRESS1,
    entry_address: proxiedEntryAddress
  });
  await alice.callSync('proxy', 'set_entry_proxy', {
    proxy_address: PROXY_ADDRESS2,
    entry_address: proxiedEntryAddress
  });

  // And now we get both previously set links
  links = await alice.callSync('proxy', 'get_links_to_proxy', {
    base_address: sampleEntryAddress,
    link_type: LINK_TYPE,
    tag: ''
  });
  t.equal(links.Ok.length, 2);
});

scenario1.runTape('links from proxy is ok', async (t, { alice }) => {
  const sampleEntryAddress = await createSampleEntry(alice);

  // Create a ghost proxy
  await alice.callSync('proxy', 'set_entry_proxy', {
    proxy_address: PROXY_ADDRESS1,
    entry_address: null
  });
  // Create a link to said proxy
  await alice.callSync('proxy', 'link_from_proxy', {
    proxy_address: PROXY_ADDRESS1,
    to_address: sampleEntryAddress,
    link_type: 'external_proxy',
    tag: ''
  });
  let links = await alice.callSync('proxy', 'get_links_from_proxy', {
    proxy_address: PROXY_ADDRESS1,
    link_type: 'external_proxy',
    tag: ''
  });
  t.equal(links.Ok.length, 1);
});

scenario1.runTape(
  'links from proxy is ok with two previous ghost proxies',
  async (t, { alice }) => {
    const sampleEntryAddress = await createSampleEntry(alice);

    // Create a ghost proxy
    await alice.callSync('proxy', 'set_entry_proxy', {
      proxy_address: PROXY_ADDRESS1,
      entry_address: null
    });
    // Create a link to said proxy
    await alice.callSync('proxy', 'link_from_proxy', {
      proxy_address: PROXY_ADDRESS1,
      to_address: sampleEntryAddress,
      link_type: LINK_TYPE,
      tag: ''
    });
    let links = await alice.callSync('proxy', 'get_links_from_proxy', {
      proxy_address: PROXY_ADDRESS1,
      link_type: LINK_TYPE,
      tag: ''
    });

    // Create second ghost proxy
    await alice.callSync('proxy', 'set_entry_proxy', {
      proxy_address: PROXY_ADDRESS2,
      entry_address: null
    });
    // And a link also
    await alice.callSync('proxy', 'link_from_proxy', {
      proxy_address: PROXY_ADDRESS2,
      to_address: sampleEntryAddress,
      link_type: LINK_TYPE,
      tag: ''
    });

    // Actually, we now know that both proxies identify the same entry
    const proxiedEntryAddress = await createSampleEntry(alice);
    await alice.callSync('proxy', 'set_entry_proxy', {
      proxy_address: PROXY_ADDRESS1,
      entry_address: proxiedEntryAddress
    });
    await alice.callSync('proxy', 'set_entry_proxy', {
      proxy_address: PROXY_ADDRESS2,
      entry_address: proxiedEntryAddress
    });

    // And now we get both previously set links
    links = await alice.callSync('proxy', 'get_links_from_proxy', {
      proxy_address: PROXY_ADDRESS1,
      link_type: LINK_TYPE,
      tag: ''
    });
    t.equal(links.Ok.length, 2);
  }
);

scenario1.runTape('remove links to proxy is ok', async (t, { alice }) => {
  const sampleEntryAddress = await createSampleEntry(alice);

  // Create a ghost proxy
  await alice.callSync('proxy', 'set_entry_proxy', {
    proxy_address: PROXY_ADDRESS1,
    entry_address: null
  });
  // Create a link to said proxy
  await alice.callSync('proxy', 'link_to_proxy', {
    base_address: sampleEntryAddress,
    proxy_address: PROXY_ADDRESS1,
    link_type: LINK_TYPE,
    tag: ''
  });
  let links = await alice.callSync('proxy', 'get_links_to_proxy', {
    base_address: sampleEntryAddress,
    link_type: LINK_TYPE,
    tag: ''
  });
  t.equal(links.Ok.length, 1);

  // Remove the link
  await alice.callSync('proxy', 'remove_link_to_proxy', {
    base_address: sampleEntryAddress,
    proxy_address: PROXY_ADDRESS1,
    link_type: LINK_TYPE,
    tag: ''
  });
  links = await alice.callSync('proxy', 'get_links_to_proxy', {
    base_address: sampleEntryAddress,
    link_type: LINK_TYPE,
    tag: ''
  });
  t.equal(links.Ok.length, 0);
});

scenario1.runTape('remove links from proxy is ok', async (t, { alice }) => {
  const sampleEntryAddress = await createSampleEntry(alice);

  // Create a ghost proxy
  await alice.callSync('proxy', 'set_entry_proxy', {
    proxy_address: PROXY_ADDRESS1,
    entry_address: null
  });
  // Create a link to said proxy
  await alice.callSync('proxy', 'link_from_proxy', {
    proxy_address: PROXY_ADDRESS1,
    to_address: sampleEntryAddress,
    link_type: 'external_proxy',
    tag: ''
  });
  let links = await alice.callSync('proxy', 'get_links_from_proxy', {
    proxy_address: PROXY_ADDRESS1,
    link_type: 'external_proxy',
    tag: ''
  });
  t.equal(links.Ok.length, 1);

  // Remove link from said proxy
  await alice.callSync('proxy', 'remove_link_from_proxy', {
    proxy_address: PROXY_ADDRESS1,
    to_address: sampleEntryAddress,
    link_type: 'external_proxy',
    tag: ''
  });
  links = await alice.callSync('proxy', 'get_links_from_proxy', {
    proxy_address: PROXY_ADDRESS1,
    link_type: 'external_proxy',
    tag: ''
  });
  t.equal(links.Ok.length, 0);
});
