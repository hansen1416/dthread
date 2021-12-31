#!/bin/bash

cargo build-bpf --manifest-path=./programs/groups/Cargo.toml --bpf-out-dir=dist/programs/groups

solana program deploy /home/hlz/solana-projects/dthread/dist/programs/groups/groups.so