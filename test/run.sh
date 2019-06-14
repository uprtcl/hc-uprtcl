#!/bin/bash

TESTS=("uprtcl.js")

for test in "${TESTS[@]}"; do
  tape $test | faucet
done