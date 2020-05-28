
const path = require("path");

const {
  Orchestrator,
  Config,
  combine,
  singleConductor,
  localOnly,
  tapeExecutor,
} = require("@holochain/tryorama");

process.on("unhandledRejection", (error) => {
  // Will print "unhandledRejection err is not defined"
  console.error("got unhandledRejection:", error);
});

const dnaPath = path.join(__dirname, "../dist/hc-uprtcl.dna.json");

const dna = Config.dna(dnaPath, "scaffold-test");
const config = Config.gen(
  { uprtcl: dna },
  {
    network: {
      type: "sim2h",
      sim2h_url: "ws://localhost:9000",
    },
  }
);

const orchestrator = new Orchestrator({
  waiter: {
    softTimeout: 20000,
    hardTimeout: 30000,
  },
});

// Execute all the tests
//require('./proxy')(orchestrator, config);
//require('./discovery')(orchestrator, config);
//require('./workspace')(diorama.registerScenario);
require('./uprtcl')(orchestrator, config);
//require('./draft')(diorama.registerScenario);

orchestrator.run();
