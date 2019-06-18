const path = require('path');

const {
  Diorama,
  tapeExecutor,
  backwardCompatibilityMiddleware
} = require('@holochain/diorama');

process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.error('got unhandledRejection:', error);
});

const dnaPath = path.join(__dirname, '../dist/hc-uprtcl.dna.json');
const dna = Diorama.dna(dnaPath, 'uprtcl');

const diorama = new Diorama({
  instances: {
    alice: dna,
    bob: dna
  },
  debugLog: true,
  executor: tapeExecutor(require('tape')),
  middleware: backwardCompatibilityMiddleware
});

// Execute all the tests
require('./uprtcl')(diorama.registerScenario);
require('./draft')(diorama.registerScenario);
//require('./proxy')(diorama.registerScenario);
//require('./discovery')(diorama.registerScenario);
//require('./workspace')(diorama.registerScenario);
//require('./draft')(diorama.registerScenario);

diorama.run();
