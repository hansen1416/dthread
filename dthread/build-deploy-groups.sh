#!/bin/bash
cargo build-bpf --manifest-path=./programs/groups/Cargo.toml --bpf-out-dir=dist/programs/groups

solana program deploy --program-id /home/hlz/solana-projects/dthread/dist/programs/groups/groups-keypair.json \
/home/hlz/solana-projects/dthread/dist/programs/groups/groups.so