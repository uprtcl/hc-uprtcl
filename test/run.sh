#!/bin/bash

TESTS=("proxy.js" "workspace.js" "draft.js" "lens.js" "discovery.js" "uprtcl.js")

for test in "${TESTS[@]}"; do
  tape $test | faucet
done